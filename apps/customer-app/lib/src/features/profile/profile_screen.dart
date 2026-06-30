import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = Supabase.instance.client.auth.currentUser;
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        children: [
          const SizedBox(height: 16),
          CircleAvatar(
            radius: 36,
            child: Text(
              (user?.email ?? '?').substring(0, 1).toUpperCase(),
              style: const TextStyle(fontSize: 28),
            ),
          ),
          const SizedBox(height: 8),
          Center(child: Text(user?.email ?? 'Guest')),
          const SizedBox(height: 24),
          const ListTile(
            leading: Icon(Icons.favorite_border),
            title: Text('Saved businesses'),
          ),
          const ListTile(
            leading: Icon(Icons.reviews_outlined),
            title: Text('My reviews'),
          ),
          const ListTile(
            leading: Icon(Icons.credit_card),
            title: Text('Payment methods'),
          ),
          const ListTile(
            leading: Icon(Icons.notifications_outlined),
            title: Text('Notification preferences'),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.redAccent),
            title: const Text('Sign out',
                style: TextStyle(color: Colors.redAccent)),
            onTap: () => Supabase.instance.client.auth.signOut(),
          ),
        ],
      ),
    );
  }
}
