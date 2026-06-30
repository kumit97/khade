import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../data/khade_repository.dart';
import '../../data/payment_service.dart';
import '../../models.dart';
import 'payment_webview_screen.dart';

/// Booking flow: pick staff → date → real time slot → confirm.
/// Time slots come from the `available_slots` RPC so double-booking is
/// prevented server-side (DB exclusion constraint backs this up).
class BookingScreen extends StatefulWidget {
  const BookingScreen({super.key, required this.business, required this.service});
  final Business business;
  final Service service;

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  late final KhadeRepository _repo = KhadeRepository(Supabase.instance.client);
  List<StaffMember> _staff = [];
  StaffMember? _selectedStaff;
  DateTime _day = DateTime.now();
  List<DateTime> _slots = [];
  DateTime? _selectedSlot;
  bool _loadingSlots = false;
  bool _booking = false;

  @override
  void initState() {
    super.initState();
    _loadStaff();
  }

  Future<void> _loadStaff() async {
    final staff = await _repo.staff(widget.business.id);
    setState(() {
      _staff = staff;
      _selectedStaff = staff.isNotEmpty ? staff.first : null;
    });
    _loadSlots();
  }

  Future<void> _loadSlots() async {
    if (_selectedStaff == null) return;
    setState(() {
      _loadingSlots = true;
      _selectedSlot = null;
    });
    final slots = await _repo.availableSlots(
      staffId: _selectedStaff!.id,
      serviceId: widget.service.id,
      day: _day,
    );
    setState(() {
      _slots = slots;
      _loadingSlots = false;
    });
  }

  Future<void> _confirm() async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null || _selectedSlot == null) return;
    setState(() => _booking = true);
    try {
      // 1. Create the (pending, unpaid) booking.
      final bookingId = await _repo.createBooking(
        customerId: userId,
        businessId: widget.business.id,
        serviceId: widget.service.id,
        staffId: _selectedStaff?.id,
        startsAt: _selectedSlot!,
        price: widget.service.price,
        currency: widget.service.currency,
      );

      // 2. Start the Paystack transaction (server-side).
      final payments = PaymentService(Supabase.instance.client);
      final init = await payments.initialize(bookingId);

      // 3. Open the hosted checkout and wait for the redirect.
      if (!mounted) return;
      final completed = await Navigator.push<bool>(
        context,
        MaterialPageRoute(
          builder: (_) => PaymentWebViewScreen(authorizationUrl: init.authorizationUrl),
        ),
      );

      if (!mounted) return;
      if (completed == true) {
        // 4. Confirm the charge (webhook is the source of truth; this is a
        //    fast-path fallback).
        final ok = await payments.verify(init.reference);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(ok
              ? 'Payment successful — booking confirmed! 🎉'
              : 'Payment received. Your booking will confirm shortly.'),
        ));
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Payment cancelled. Your booking is saved as pending.'),
        ));
        Navigator.pop(context);
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not complete booking: $e')),
      );
    } finally {
      if (mounted) setState(() => _booking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final df = DateFormat('EEE, MMM d');
    final tf = DateFormat('h:mm a');
    return Scaffold(
      appBar: AppBar(title: Text(widget.service.name)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('${widget.service.currency} '
              '${widget.service.price.toStringAsFixed(2)} · '
              '${widget.service.durationMinutes} min'),
          const SizedBox(height: 20),
          const Text('Staff', style: TextStyle(fontWeight: FontWeight.bold)),
          Wrap(
            spacing: 8,
            children: [
              for (final s in _staff)
                ChoiceChip(
                  label: Text(s.displayName),
                  selected: _selectedStaff?.id == s.id,
                  onSelected: (_) {
                    setState(() => _selectedStaff = s);
                    _loadSlots();
                  },
                ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              const Text('Date', style: TextStyle(fontWeight: FontWeight.bold)),
              const Spacer(),
              TextButton(
                onPressed: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: _day,
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 60)),
                  );
                  if (picked != null) {
                    setState(() => _day = picked);
                    _loadSlots();
                  }
                },
                child: Text(df.format(_day)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text('Available times',
              style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          if (_loadingSlots)
            const Center(child: CircularProgressIndicator())
          else if (_slots.isEmpty)
            const Text('No open slots this day. Try another date.')
          else
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final slot in _slots)
                  ChoiceChip(
                    label: Text(tf.format(slot.toLocal())),
                    selected: _selectedSlot == slot,
                    onSelected: (_) => setState(() => _selectedSlot = slot),
                  ),
              ],
            ),
          const SizedBox(height: 28),
          FilledButton(
            onPressed: (_selectedSlot == null || _booking) ? null : _confirm,
            child: Text(_booking ? 'Processing…' : 'Pay & confirm booking'),
          ),
          const SizedBox(height: 8),
          const Text(
            'Secure payment via Paystack (cards, bank transfer, USSD). Card data '
            'never touches KHADE servers — the Paystack secret key stays in the '
            'backend.',
            style: TextStyle(fontSize: 12, color: Colors.grey),
          ),
        ],
      ),
    );
  }
}
