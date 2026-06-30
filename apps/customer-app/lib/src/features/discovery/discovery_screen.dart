import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../data/khade_repository.dart';
import '../../models.dart';
import '../business/business_screen.dart';

const _categories = [
  'barber',
  'salon',
  'makeup_artist',
  'nail_tech',
  'massage_therapist',
  'spa',
  'esthetician',
  'tattoo_artist',
  'skincare_clinic',
];

class DiscoveryScreen extends StatefulWidget {
  const DiscoveryScreen({super.key});

  @override
  State<DiscoveryScreen> createState() => _DiscoveryScreenState();
}

class _DiscoveryScreenState extends State<DiscoveryScreen> {
  late final KhadeRepository _repo =
      KhadeRepository(Supabase.instance.client);
  final _search = TextEditingController();
  String? _category;
  late Future<List<Business>> _future;

  @override
  void initState() {
    super.initState();
    _future = _repo.discover();
  }

  void _reload() {
    setState(() {
      _future = _repo.discover(query: _search.text, category: _category);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Discover')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _search,
              onSubmitted: (_) => _reload(),
              decoration: InputDecoration(
                hintText: 'Search salons, barbers, makeup…',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.tune),
                  onPressed: _reload,
                ),
              ),
            ),
          ),
          SizedBox(
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              children: [
                for (final c in _categories)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: ChoiceChip(
                      label: Text(c.replaceAll('_', ' ')),
                      selected: _category == c,
                      onSelected: (sel) {
                        setState(() => _category = sel ? c : null);
                        _reload();
                      },
                    ),
                  ),
              ],
            ),
          ),
          Expanded(
            child: FutureBuilder<List<Business>>(
              future: _future,
              builder: (context, snap) {
                if (snap.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snap.hasError) {
                  return Center(child: Text('Something went wrong.\n${snap.error}'));
                }
                final items = snap.data ?? [];
                if (items.isEmpty) {
                  return const Center(child: Text('No businesses found.'));
                }
                return ListView.separated(
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (context, i) {
                    final b = items[i];
                    return ListTile(
                      title: Text(b.name),
                      subtitle: Text(
                          '${b.category.replaceAll('_', ' ')} · ${b.city ?? ''}'),
                      trailing: b.ratingCount > 0
                          ? Text('★ ${b.ratingAvg.toStringAsFixed(1)}')
                          : const Text('New'),
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => BusinessScreen(business: b),
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
