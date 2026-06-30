import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../data/khade_repository.dart';

class MyBookingsScreen extends StatefulWidget {
  const MyBookingsScreen({super.key});

  @override
  State<MyBookingsScreen> createState() => _MyBookingsScreenState();
}

class _MyBookingsScreenState extends State<MyBookingsScreen> {
  late final KhadeRepository _repo = KhadeRepository(Supabase.instance.client);
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    final uid = Supabase.instance.client.auth.currentUser!.id;
    _future = _repo.myBookings(uid);
  }

  @override
  Widget build(BuildContext context) {
    final df = DateFormat('EEE, MMM d · h:mm a');
    return Scaffold(
      appBar: AppBar(title: const Text('My bookings')),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final rows = snap.data ?? [];
          if (rows.isEmpty) {
            return const Center(child: Text('No bookings yet. Go discover something!'));
          }
          return ListView.separated(
            itemCount: rows.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, i) {
              final b = rows[i];
              return ListTile(
                title: Text(b['businesses']?['name'] ?? 'Business'),
                subtitle: Text(
                    '${b['services']?['name'] ?? ''}\n${df.format(DateTime.parse(b['starts_at']).toLocal())}'),
                isThreeLine: true,
                trailing: Chip(label: Text(b['status'])),
              );
            },
          );
        },
      ),
    );
  }
}
