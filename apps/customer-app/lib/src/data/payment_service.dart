import 'package:supabase_flutter/supabase_flutter.dart';

/// Calls the Paystack edge functions. The user's JWT is attached automatically
/// by supabase_flutter, so the functions can authorise the caller.
class PaymentService {
  PaymentService(this._supabase);
  final SupabaseClient _supabase;

  /// Custom scheme Paystack redirects to once checkout finishes. Intercepted by
  /// the in-app webview to know when to verify.
  static const callbackUrl = 'khade://payment-callback';

  /// Start a transaction; returns the hosted checkout URL + reference.
  Future<({String authorizationUrl, String reference})> initialize(
    String bookingId,
  ) async {
    final res = await _supabase.functions.invoke(
      'paystack-initialize',
      body: {'booking_id': bookingId, 'callback_url': callbackUrl},
    );
    final data = res.data as Map<String, dynamic>;
    if (data['authorization_url'] == null) {
      throw Exception(data['error'] ?? 'Could not start payment');
    }
    return (
      authorizationUrl: data['authorization_url'] as String,
      reference: data['reference'] as String,
    );
  }

  /// Confirm the charge after the checkout redirect (fallback to the webhook).
  /// Returns true when the payment is settled successfully.
  Future<bool> verify(String reference) async {
    final res = await _supabase.functions.invoke(
      'paystack-verify',
      body: {'reference': reference},
    );
    final data = res.data as Map<String, dynamic>;
    return data['status'] == 'success';
  }
}
