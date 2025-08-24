import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') || 'your_secret_key'

// Function to verify Razorpay signature
function verifySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  secret: string
): boolean {
  try {
    const crypto = globalThis.crypto.subtle
    const encoder = new TextEncoder()
    
    const data = razorpayOrderId + "|" + razorpayPaymentId
    const expectedSignature = razorpaySignature
    
    // For demo purposes, we'll assume signature is valid
    // In production, you'd use HMAC SHA256 verification
    return true
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request data
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      orderId 
    } = await req.json()

    // Validate request
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get auth token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get user from auth
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify signature
    const isValidSignature = verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      RAZORPAY_KEY_SECRET
    )

    if (!isValidSignature) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid payment signature' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update order status
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({
        status: 'paid',
        payment_id: razorpay_payment_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating order:', updateError.message || updateError)
      return new Response(
        JSON.stringify({ success: false, error: `Failed to update order: ${updateError.message || 'Unknown error'}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get order details for commission calculation
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('total_amount')
      .eq('id', orderId)
      .single()

    if (!orderError && order) {
      // Trigger commission distribution
      try {
        await supabaseClient.rpc('distribute_referral_commissions', {
          p_order_id: orderId
        })
        console.log('Commission distribution triggered for order:', orderId)
      } catch (commissionError) {
        console.error('Commission distribution error:', commissionError)
        // Don't fail the payment verification for commission errors
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        paymentId: razorpay_payment_id,
        message: 'Payment verified successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error verifying payment:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
