/**
 * Twilio API Client
 * 
 * This module provides functions to interact with the Twilio API
 * for managing phone numbers and making calls.
 */

import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN

if (!accountSid || !authToken) {
  console.warn('[Twilio Client] Twilio credentials not configured. Some features will be unavailable.')
}

const client = accountSid && authToken ? twilio(accountSid, authToken) : null

export interface TwilioPhoneNumber {
  sid: string
  phoneNumber: string
  friendlyName: string
}

export interface CreatePhoneNumberParams {
  areaCode?: string
  countryCode?: string
}

/**
 * Purchase a Twilio phone number
 */
export async function purchasePhoneNumber(
  params?: CreatePhoneNumberParams
): Promise<TwilioPhoneNumber> {
  if (!client) {
    throw new Error('Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.')
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL}`
      : 'http://localhost:3000'

    const searchParams: any = {
      voiceEnabled: true,
      smsEnabled: false, // Optional: enable SMS if needed
    }

    if (params?.areaCode) {
      searchParams.areaCode = params.areaCode
    }
    if (params?.countryCode) {
      searchParams.countryCode = params.countryCode
    } else {
      searchParams.countryCode = 'US' // Default to US
    }

    // Search for available numbers
    const availableNumbers = await client.availablePhoneNumbers(searchParams.countryCode)
      .local.list(searchParams)

    if (availableNumbers.length === 0) {
      throw new Error('No phone numbers available for the specified criteria')
    }

    // Purchase the first available number
    const number = availableNumbers[0]
    const purchasedNumber = await client.incomingPhoneNumbers.create({
      phoneNumber: number.phoneNumber,
      voiceUrl: `${appUrl}/api/twilio/voice`,
      statusCallback: `${appUrl}/api/twilio/status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      voiceMethod: 'POST',
      statusCallbackMethod: 'POST',
    })

    console.log('[Twilio Client] Phone number purchased:', {
      sid: purchasedNumber.sid,
      phoneNumber: purchasedNumber.phoneNumber,
    })

    return {
      sid: purchasedNumber.sid,
      phoneNumber: purchasedNumber.phoneNumber,
      friendlyName: purchasedNumber.friendlyName || purchasedNumber.phoneNumber,
    }
  } catch (error) {
    console.error('[Twilio Client] Purchase phone number error:', error)
    throw error
  }
}

/**
 * Get phone number details
 */
export async function getPhoneNumber(
  phoneNumberSid: string
): Promise<TwilioPhoneNumber> {
  if (!client) {
    throw new Error('Twilio credentials not configured')
  }

  try {
    const number = await client.incomingPhoneNumbers(phoneNumberSid).fetch()
    
    return {
      sid: number.sid,
      phoneNumber: number.phoneNumber,
      friendlyName: number.friendlyName || number.phoneNumber,
    }
  } catch (error) {
    console.error('[Twilio Client] Get phone number error:', error)
    throw error
  }
}

/**
 * Update phone number webhook URLs
 */
export async function updatePhoneNumberWebhooks(
  phoneNumberSid: string,
  voiceUrl: string,
  statusCallbackUrl: string
): Promise<void> {
  if (!client) {
    throw new Error('Twilio credentials not configured')
  }

  try {
    await client.incomingPhoneNumbers(phoneNumberSid).update({
      voiceUrl,
      statusCallback: statusCallbackUrl,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      voiceMethod: 'POST',
      statusCallbackMethod: 'POST',
    })

    console.log('[Twilio Client] Phone number webhooks updated:', {
      phoneNumberSid,
      voiceUrl,
      statusCallbackUrl,
    })
  } catch (error) {
    console.error('[Twilio Client] Update webhooks error:', error)
    throw error
  }
}

/**
 * Make outbound call (for re-engagement campaigns)
 */
export async function makeOutboundCall(params: {
  to: string
  from: string
  agentId: string
  systemPrompt: string
}): Promise<string> {
  if (!client) {
    throw new Error('Twilio credentials not configured')
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL}`
      : 'http://localhost:3000'

    const call = await client.calls.create({
      to: params.to,
      from: params.from,
      url: `${appUrl}/api/twilio/voice?agent_id=${params.agentId}`,
      statusCallback: `${appUrl}/api/twilio/status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      method: 'POST',
      statusCallbackMethod: 'POST',
    })

    console.log('[Twilio Client] Outbound call initiated:', {
      callSid: call.sid,
      to: params.to,
      from: params.from,
    })

    return call.sid
  } catch (error) {
    console.error('[Twilio Client] Make outbound call error:', error)
    throw error
  }
}

/**
 * Get call details
 */
export async function getCallDetails(callSid: string) {
  if (!client) {
    throw new Error('Twilio credentials not configured')
  }

  try {
    const call = await client.calls(callSid).fetch()
    return {
      sid: call.sid,
      status: call.status,
      from: call.from,
      to: call.to,
      duration: call.duration,
      startTime: call.startTime,
      endTime: call.endTime,
    }
  } catch (error) {
    console.error('[Twilio Client] Get call details error:', error)
    throw error
  }
}

/**
 * Release (delete) a phone number
 */
export async function releasePhoneNumber(phoneNumberSid: string): Promise<void> {
  if (!client) {
    throw new Error('Twilio credentials not configured')
  }

  try {
    await client.incomingPhoneNumbers(phoneNumberSid).remove()
    console.log('[Twilio Client] Phone number released:', phoneNumberSid)
  } catch (error) {
    console.error('[Twilio Client] Release phone number error:', error)
    throw error
  }
}

