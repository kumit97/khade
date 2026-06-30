import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../data/khade_repository.dart';
import '../../models.dart';
import '../booking/booking_screen.dart';

/// Business profile: services, staff, reviews and the entry to booking.
class BusinessScreen extends StatefulWidget {
  const BusinessScreen({super.key, required this.business});
  final Business business;

  @override
  State<BusinessScreen> createState() => _BusinessScreenState();
}

class _BusinessScreenState extends State<BusinessScreen> {
  late final KhadeRepository _repo = KhadeRepository(Supabase.instance.client);
  late Future<List<Service>> _services;

  @override
  void initState() {
    super.initState();
    _services = _repo.services(widget.business.id);
  }

  @override
  Widget build(BuildContext context) {
    final b = widget.business;
    return Scaffold(
      appBar: AppBar(title: Text(b.name)),
      body: ListView(
        children: [
          Container(
            height: 160,
            color: Theme.of(context).colorScheme.primaryContainer,
            alignment: Alignment.center,
            child: const Icon(Icons.spa, size: 56),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(b.name, style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 4),
                Text(
                  '${b.category.replaceAll('_', ' ')}'
                  '${b.ratingCount > 0 ? '  ·  ★ ${b.ratingAvg.toStringAsFixed(1)} (${b.ratingCount})' : '  ·  New'}',
                ),
                if (b.description != null) ...[
                  const SizedBox(height: 12),
                  Text(b.description!),
                ],
              ],
            ),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Text('Services', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
          FutureBuilder<List<Service>>(
            future: _services,
            builder: (context, snap) {
              if (snap.connectionState == ConnectionState.waiting) {
                return const Padding(
                  padding: EdgeInsets.all(24),
                  child: Center(child: CircularProgressIndicator()),
                );
              }
              final services = snap.data ?? [];
              if (services.isEmpty) {
                return const Padding(
                  padding: EdgeInsets.all(24),
                  child: Text('No services listed yet.'),
                );
              }
              return Column(
                children: [
                  for (final s in services)
                    ListTile(
                      title: Text(s.name),
                      subtitle: Text('${s.durationMinutes} min'),
                      trailing: Text(
                          '${s.currency} ${s.price.toStringAsFixed(2)}'),
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => BookingScreen(
                            business: b,
                            service: s,
                          ),
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}
