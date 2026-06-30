import 'package:flutter/material.dart';

/// KHADE brand theme. Accessible contrast and ≥48dp tap targets per spec.
ThemeData buildKhadeTheme() {
  const seed = Color(0xFF7C4DFF);
  return ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(seedColor: seed),
    visualDensity: VisualDensity.standard,
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(48),
      ),
    ),
  );
}
