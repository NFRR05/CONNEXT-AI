import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DELETE: Delete an agent (admin only or owner)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const agentId = params.id

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role || 'client'

    // Check if agent exists and get owner
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, user_id')
      .eq('id', agentId)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Only admin/support or the owner can delete
    if (userRole !== 'admin' && userRole !== 'support' && agent.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own agents' },
        { status: 403 }
      )
    }

    // Delete the agent (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('agents')
      .delete()
      .eq('id', agentId)

    if (deleteError) {
      console.error('Error deleting agent:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete agent' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Agent deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting agent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

