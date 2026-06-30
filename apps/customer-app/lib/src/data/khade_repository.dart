import 'package:supabase_flutter/supabase_flutter.dart';

import '../models.dart';

/// Data access for the customer app. All calls run under RLS as the signed-in
/// customer (or anon for public discovery reads).
class KhadeRepository {
  KhadeRepository(this._db);
  final SupabaseClient _db;

  Future<List<Business>> discover({
    String? query,
    String? category,
  }) async {
    var q = _db
        .from('businesses')
        .select('id, name, category, description, city, rating_avg, rating_count, is_featured')
        .eq('verification_status', 'verified');

    if (category != null) q = q.eq('category', category);
    if (query != null && query.isNotEmpty) q = q.ilike('name', '%$query%');

    final rows = await q.order('is_featured', ascending: false).limit(50);
    return (rows as List).map((r) => Business.fromMap(r)).toList();
  }

  /// Nearby verified businesses via the Postgres `nearby_businesses` RPC.
  Future<List<Map<String, dynamic>>> nearby({
    required double lng,
    required double lat,
    int radiusMeters = 10000,
    String? category,
  }) async {
    final rows = await _db.rpc('nearby_businesses', params: {
      'p_lng': lng,
      'p_lat': lat,
      'p_radius_meters': radiusMeters,
      'p_category': category,
    });
    return (rows as List).cast<Map<String, dynamic>>();
  }

  Future<List<Service>> services(String businessId) async {
    final rows = await _db
        .from('services')
        .select('id, name, price, currency, duration_minutes')
        .eq('business_id', businessId)
        .eq('is_active', true);
    return (rows as List).map((r) => Service.fromMap(r)).toList();
  }

  Future<List<StaffMember>> staff(String businessId) async {
    final rows = await _db
        .from('business_staff')
        .select('id, display_name, title')
        .eq('business_id', businessId)
        .eq('is_active', true);
    return (rows as List).map((r) => StaffMember.fromMap(r)).toList();
  }

  /// Real availability for a staff member on a day, via the `available_slots`
  /// RPC. Returns slot start times — already excludes booked ranges.
  Future<List<DateTime>> availableSlots({
    required String staffId,
    required String serviceId,
    required DateTime day,
    String timezone = 'UTC',
  }) async {
    final rows = await _db.rpc('available_slots', params: {
      'p_staff_id': staffId,
      'p_service_id': serviceId,
      'p_day': day.toIso8601String().substring(0, 10),
      'p_tz': timezone,
    });
    return (rows as List)
        .map((r) => DateTime.parse(r['slot_start'] as String))
        .toList();
  }

  /// Create a booking and return its id. The DB derives end time, enforces no
  /// double-booking via the exclusion constraint, and runs the fraud-check
  /// trigger.
  Future<String> createBooking({
    required String customerId,
    required String businessId,
    required String serviceId,
    String? staffId,
    required DateTime startsAt,
    required num price,
    required String currency,
    String? notes,
  }) async {
    final row = await _db.from('bookings').insert({
      'customer_id': customerId,
      'business_id': businessId,
      'service_id': serviceId,
      'staff_id': staffId,
      // ends_at is required by the schema but overwritten by the trigger; send
      // a placeholder equal to start so the NOT NULL check passes pre-trigger.
      'starts_at': startsAt.toUtc().toIso8601String(),
      'ends_at': startsAt.toUtc().toIso8601String(),
      'price': price,
      'currency': currency,
      'notes': notes,
    }).select('id').single();
    return row['id'] as String;
  }

  Future<List<Map<String, dynamic>>> myBookings(String customerId) async {
    final rows = await _db
        .from('bookings')
        .select('id, starts_at, status, price, currency, businesses(name), services(name)')
        .eq('customer_id', customerId)
        .order('starts_at', ascending: false);
    return (rows as List).cast<Map<String, dynamic>>();
  }

  Future<void> toggleFavorite(String customerId, String businessId, bool on) async {
    if (on) {
      await _db.from('favorites').insert({'user_id': customerId, 'business_id': businessId});
    } else {
      await _db
          .from('favorites')
          .delete()
          .match({'user_id': customerId, 'business_id': businessId});
    }
  }
}
