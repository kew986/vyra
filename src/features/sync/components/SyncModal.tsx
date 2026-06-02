import { useState, useEffect, useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { X, Smartphone, Monitor, QrCode, AlertCircle, CheckCircle2, Loader2, ArrowRightLeft } from 'lucide-react'
import { useSyncStore } from '../store/syncStore'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { cn } from '@/shared/utils/cn'

interface SyncModalProps {
  onClose: () => void
}

export function SyncModal({ onClose }: SyncModalProps) {
  const [mode, setMode] = useState<'select' | 'host' | 'client'>('select')
  const [joinId, setJoinId] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  
  const { status, hostId, error, logs, startHosting, connectToHost, stop } = useSyncStore()
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    return () => {
      stop()
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error)
      }
    }
  }, [stop])

  // Initialize scanner
  useEffect(() => {
    if (showScanner && mode === 'client') {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      )
      
      scannerRef.current.render((decodedText) => {
        setJoinId(decodedText)
        setShowScanner(false)
        scannerRef.current?.clear()
        connectToHost(decodedText)
      }, (err) => {
        // Ignore continuous scan errors
      })
    }
    
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error)
      }
    }
  }, [showScanner, mode, connectToHost])

  const handleStartHost = () => {
    setMode('host')
    startHosting()
  }

  const handleStartClient = () => {
    setMode('client')
  }

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault()
    if (joinId.trim()) {
      connectToHost(joinId.trim())
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-2">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="text-primary" size={20} />
            <h2 className="text-lg font-bold text-text-1">Device Sync</h2>
          </div>
          <button onClick={onClose} className="text-text-3 hover:text-text-1 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          
          {error && (
            <div className="w-full mb-6 p-4 bg-danger/10 border border-danger/20 rounded-lg flex items-start gap-3 text-danger">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="w-full flex flex-col items-center py-8">
              <div className="w-16 h-16 bg-success/20 text-success rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-text-1 mb-2">Sync Complete!</h3>
              <p className="text-text-2 text-center text-sm mb-6">
                Both devices have securely merged their databases.
              </p>
              <Button onClick={onClose} variant="primary" className="w-full">Done</Button>
            </div>
          )}

          {status !== 'success' && mode === 'select' && (
            <div className="w-full grid grid-cols-2 gap-4">
              <button 
                onClick={handleStartHost}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border bg-surface hover:bg-surface-2 transition-all group"
              >
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Monitor size={24} />
                </div>
                <div className="text-center">
                  <span className="block font-medium text-text-1 mb-1">Host Device</span>
                  <span className="block text-xs text-text-3">Share data from here</span>
                </div>
              </button>
              
              <button 
                onClick={handleStartClient}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border bg-surface hover:bg-surface-2 transition-all group"
              >
                <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Smartphone size={24} />
                </div>
                <div className="text-center">
                  <span className="block font-medium text-text-1 mb-1">Connect Device</span>
                  <span className="block text-xs text-text-3">Scan & receive data</span>
                </div>
              </button>
            </div>
          )}

          {status !== 'success' && mode === 'host' && (
            <div className="w-full flex flex-col items-center text-center">
              {status === 'hosting' ? (
                <>
                  <p className="text-sm text-text-2 mb-6">
                    Scan this QR code from your other device to establish a secure peer-to-peer connection.
                  </p>
                  
                  <div className="p-4 bg-white rounded-xl mb-6">
                    {hostId ? <QRCodeCanvas value={hostId} size={200} /> : <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-100 animate-pulse" />}
                  </div>

                  <div className="bg-surface-2 border border-border rounded-lg px-4 py-3 flex items-center gap-4 w-full">
                    <div className="flex-1 text-left">
                      <span className="block text-xs text-text-3 uppercase font-bold tracking-wider mb-1">Sync Code</span>
                      <span className="block text-xl font-mono text-text-1 font-bold tracking-[0.2em]">{hostId || '...'}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 flex flex-col items-center">
                  <Loader2 className="animate-spin text-primary mb-4" size={32} />
                  <p className="text-text-1 font-medium">Syncing Data...</p>
                  <p className="text-sm text-text-3 mt-2">{logs[logs.length - 1]}</p>
                </div>
              )}
            </div>
          )}

          {status !== 'success' && mode === 'client' && (
            <div className="w-full">
              {status === 'idle' || status === 'connecting' ? (
                <>
                  <p className="text-sm text-text-2 mb-6 text-center">
                    Enter the Sync Code from the host device, or scan its QR code.
                  </p>
                  
                  {showScanner ? (
                    <div className="w-full mb-6 overflow-hidden rounded-xl border border-border">
                      <div id="reader" style={{ width: '100%' }}></div>
                      <Button variant="ghost" className="w-full mt-2" onClick={() => setShowScanner(false)}>Cancel Scan</Button>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full mb-6 flex items-center justify-center gap-2"
                      onClick={() => setShowScanner(true)}
                    >
                      <QrCode size={18} /> Scan QR Code
                    </Button>
                  )}

                  <div className="relative flex items-center py-2 mb-6">
                    <div className="flex-grow border-t border-border"></div>
                    <span className="flex-shrink-0 mx-4 text-text-3 text-xs uppercase font-medium">Or enter code</span>
                    <div className="flex-grow border-t border-border"></div>
                  </div>

                  <form onSubmit={handleConnect} className="flex gap-2">
                    <Input 
                      placeholder="VYRA-XXXXX" 
                      value={joinId}
                      onChange={e => setJoinId(e.target.value.toUpperCase())}
                      className="font-mono uppercase tracking-widest text-center"
                      disabled={status !== 'idle'}
                    />
                    <Button 
                      type="submit" 
                      variant="primary" 
                      disabled={!joinId.trim() || status !== 'idle'}
                      className="min-w-[100px]"
                    >
                      {status === 'connecting' ? <Loader2 size={18} className="animate-spin" /> : 'Connect'}
                    </Button>
                  </form>
                </>
              ) : (
                <div className="py-12 flex flex-col items-center">
                  <Loader2 className="animate-spin text-primary mb-4" size={32} />
                  <p className="text-text-1 font-medium">Syncing Data...</p>
                  <p className="text-sm text-text-3 mt-2 text-center">{logs[logs.length - 1]}</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
