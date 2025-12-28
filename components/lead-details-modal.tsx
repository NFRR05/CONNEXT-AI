'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { format, formatDistanceToNow } from 'date-fns'
import { Phone, Clock, Play, Pause, Download, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Lead {
  id: string
  agent_id: string
  customer_phone: string | null
  call_summary: string | null
  call_transcript: string | null
  recording_url: string | null
  sentiment: string | null
  structured_data: any
  status: 'New' | 'Contacted' | 'Closed'
  duration: number | null
  created_at: string
  updated_at: string
  agents: {
    id: string
    name: string
  }
}

interface LeadDetailsModalProps {
  lead: Lead
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusUpdate: (status: 'New' | 'Contacted' | 'Closed') => void
}

export function LeadDetailsModal({
  lead,
  open,
  onOpenChange,
  onStatusUpdate,
}: LeadDetailsModalProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [copied, setCopied] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  function formatTime(seconds: number): string {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current
    if (!audio) return
    const newTime = parseFloat(e.target.value)
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function getStatusBadgeVariant(status: string) {
    switch (status) {
      case 'New':
        return 'default'
      case 'Contacted':
        return 'secondary'
      case 'Closed':
        return 'outline'
      default:
        return 'default'
    }
  }

  function getSentimentColor(sentiment: string | null): string {
    if (!sentiment) return 'text-muted-foreground'
    const lower = sentiment.toLowerCase()
    if (lower.includes('positive') || lower.includes('happy')) return 'text-green-600 dark:text-green-400'
    if (lower.includes('negative') || lower.includes('angry')) return 'text-red-600 dark:text-red-400'
    return 'text-yellow-600 dark:text-yellow-400'
  }

  function formatDuration(seconds: number | null): string {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Lead Details</DialogTitle>
            <Select
              value={lead.status}
              onValueChange={(value: 'New' | 'Contacted' | 'Closed') => onStatusUpdate(value)}
            >
              <SelectTrigger className="w-[140px]">
                <Badge variant={getStatusBadgeVariant(lead.status) as any}>
                  {lead.status}
                </Badge>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Contacted">Contacted</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogDescription>
            Call received {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Agent</label>
              <p className="text-sm font-medium mt-1">{lead.agents.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
              <div className="flex items-center gap-2 mt-1">
                {lead.customer_phone ? (
                  <>
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{lead.customer_phone}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCopy(lead.customer_phone!)}
                    >
                      {copied ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">N/A</span>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Call Duration</label>
              <div className="flex items-center gap-1 mt-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{formatDuration(lead.duration)}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Sentiment</label>
              <p className={cn('text-sm font-medium mt-1', getSentimentColor(lead.sentiment))}>
                {lead.sentiment || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date</label>
              <p className="text-sm mt-1">
                {format(new Date(lead.created_at), 'PPp')}
              </p>
            </div>
          </div>

          <Separator />

          {/* Audio Player */}
          {lead.recording_url && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Call Recording</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = lead.recording_url!
                    link.download = `call-recording-${lead.id}.mp3`
                    link.click()
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
              <div className="space-y-2">
                <audio ref={audioRef} src={lead.recording_url} className="hidden" />
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={togglePlay}
                    className="h-10 w-10"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>
                  <div className="flex-1 space-y-1">
                    <input
                      type="range"
                      min="0"
                      max={duration || 0}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Call Summary */}
          {lead.call_summary && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Call Summary</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(lead.call_summary!)}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {lead.call_summary}
                </p>
              </div>
            </>
          )}

          {/* Transcript */}
          {lead.call_transcript && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Full Transcript</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(lead.call_transcript!)}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-muted rounded-lg p-4 max-h-[300px] overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap">{lead.call_transcript}</p>
                </div>
              </div>
            </>
          )}

          {/* Structured Data */}
          {lead.structured_data && Object.keys(lead.structured_data).length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <label className="text-sm font-medium">Structured Data</label>
                <div className="bg-muted rounded-lg p-4">
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(lead.structured_data, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

