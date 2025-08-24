import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createWithdrawalRequest, getCurrentUser, getUserProfile } from '@/lib/supabase'

interface WithdrawalRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const WithdrawalRequestDialog: React.FC<WithdrawalRequestDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const [upiId, setUpiId] = useState('')
  const [amount, setAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableBalance, setAvailableBalance] = useState(0)

  React.useEffect(() => {
    if (open) {
      loadUserBalance()
    }
  }, [open])

  const loadUserBalance = async () => {
    try {
      const user = await getCurrentUser()
      if (user) {
        const profile = await getUserProfile(user.id)
        setAvailableBalance(profile?.available_balance || 0)
      }
    } catch (error) {
      console.error('Error loading user balance:', error)
    }
  }

  const validateUPI = (upi: string) => {
    // Basic UPI ID validation - should end with @provider
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/
    return upiRegex.test(upi)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!upiId.trim()) {
      toast.error('Please enter your UPI ID')
      return
    }

    if (!validateUPI(upiId)) {
      toast.error('Please enter a valid UPI ID (e.g., yourname@paytm)')
      return
    }

    const withdrawalAmount = parseFloat(amount)
    if (!withdrawalAmount || withdrawalAmount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (withdrawalAmount > availableBalance) {
      toast.error('Insufficient balance')
      return
    }

    if (withdrawalAmount < 10) {
      toast.error('Minimum withdrawal amount is ₹10')
      return
    }

    setIsSubmitting(true)

    try {
      const user = await getCurrentUser()
      if (!user) {
        toast.error('Please login to continue')
        return
      }

      await createWithdrawalRequest(user.id, withdrawalAmount, upiId)
      
      toast.success('Withdrawal request submitted successfully! You will be notified once it\'s processed.')
      
      // Reset form
      setUpiId('')
      setAmount('')
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error creating withdrawal request:', error)
      toast.error('Failed to submit withdrawal request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Withdrawal</DialogTitle>
          <DialogDescription>
            Enter your UPI ID and withdrawal amount. Your request will be processed by our admin team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="available-balance">Available Balance</Label>
            <div className="text-2xl font-bold text-green-600">
              ₹{availableBalance.toFixed(2)}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="upi-id">UPI ID *</Label>
            <Input
              id="upi-id"
              type="text"
              placeholder="yourname@paytm"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter your UPI ID (e.g., yourname@paytm, yourname@gpay)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount *</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              min="10"
              max={availableBalance}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Minimum withdrawal: ₹10
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !upiId || !amount}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
WithdrawalRequestDialog.displayName = "WithdrawalRequestDialog"

export { WithdrawalRequestDialog }
