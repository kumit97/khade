/// Lightweight model classes mirroring the public.* schema rows the customer
/// app reads. Kept in sync with packages/shared/src/types.ts.

class Business {
  final String id;
  final String name;
  final String category;
  final String? description;
  final String? city;
  final num ratingAvg;
  final int ratingCount;
  final bool isFeatured;

  Business({
    required this.id,
    required this.name,
    required this.category,
    required this.ratingAvg,
    required this.ratingCount,
    required this.isFeatured,
    this.description,
    this.city,
  });

  factory Business.fromMap(Map<String, dynamic> m) => Business(
        id: m['id'] as String,
        name: m['name'] as String,
        category: m['category'] as String,
        description: m['description'] as String?,
        city: m['city'] as String?,
        ratingAvg: (m['rating_avg'] ?? 0) as num,
        ratingCount: (m['rating_count'] ?? 0) as int,
        isFeatured: (m['is_featured'] ?? false) as bool,
      );
}

class Service {
  final String id;
  final String name;
  final num price;
  final String currency;
  final int durationMinutes;

  Service({
    required this.id,
    required this.name,
    required this.price,
    required this.currency,
    required this.durationMinutes,
  });

  factory Service.fromMap(Map<String, dynamic> m) => Service(
        id: m['id'] as String,
        name: m['name'] as String,
        price: (m['price'] ?? 0) as num,
        currency: (m['currency'] ?? 'USD') as String,
        durationMinutes: (m['duration_minutes'] ?? 0) as int,
      );
}

class StaffMember {
  final String id;
  final String displayName;
  final String? title;

  StaffMember({required this.id, required this.displayName, this.title});

  factory StaffMember.fromMap(Map<String, dynamic> m) => StaffMember(
        id: m['id'] as String,
        displayName: m['display_name'] as String,
        title: m['title'] as String?,
      );
}
