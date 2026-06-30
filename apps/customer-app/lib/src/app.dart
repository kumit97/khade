import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'features/auth/auth_screen.dart';
import 'features/home/home_shell.dart';
import 'theme.dart';

class KhadeApp extends StatelessWidget {
  const KhadeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'KHADE',
      debugShowCheckedModeBanner: false,
      theme: buildKhadeTheme(),
      home: const _AuthGate(),
    );
  }
}

/// Routes between sign-in and the app shell based on the Supabase auth session.
class _AuthGate extends StatelessWidget {
  const _AuthGate();

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<AuthState>(
      stream: Supabase.instance.client.auth.onAuthStateChange,
      builder: (context, snapshot) {
        final session = Supabase.instance.client.auth.currentSession;
        if (session == null) return const AuthScreen();
        return const HomeShell();
      },
    );
  }
}
