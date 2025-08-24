import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Save, RotateCcw } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { loadRewardConfig, DEFAULT_REFERRAL_REWARD_CONFIG } from '@/lib/fixed-reward-system'
import { supabase } from '@/lib/supabase'
import { hasAdminAccess, supabaseAdmin } from '@/lib/supabase-admin'

export const RewardConfigManager: React.FC = () => {
  const [config, setConfig] = useState(DEFAULT_REFERRAL_REWARD_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCurrentConfig()
  }, [])

  const loadCurrentConfig = async () => {
    try {
      setLoading(true)
      const currentConfig = await loadRewardConfig()
      setConfig(currentConfig)
    } catch (error) {
      console.error('Error loading config:', error)
      toast({
        description: 'Failed to load reward configuration',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConfigChange = (level: string, value: string) => {
    const numValue = parseFloat(value) || 0
    setConfig(prev => ({
      ...prev,
      [level]: numValue
    }))
  }

  const saveConfig = async () => {
    try {
      setSaving(true)
      
      const client = hasAdminAccess ? supabaseAdmin! : supabase
      
      const { error } = await client
        .from('system_settings')
        .upsert({
          key: 'referral_reward_config',
          value: config,
          description: '7-level fixed reward structure amounts in rupees'
        })

      if (error) throw error

      toast({
        description: 'Reward configuration updated successfully!',
        variant: 'default'
      })
    } catch (error: any) {
      console.error('Error saving config:', error)
      toast({
        description: `Failed to save configuration: ${error.message}`,
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = () => {
    setConfig(DEFAULT_REFERRAL_REWARD_CONFIG)
    toast({
      description: 'Configuration reset to defaults (not saved yet)',
      variant: 'default'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div>Loading reward configuration...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          7-Level Reward Configuration
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure the fixed reward amounts for each referral level. Changes take effect immediately.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.entries(config).map(([level, amount]) => (
            <div key={level} className="space-y-2">
              <Label htmlFor={level} className="text-sm font-medium">
                {level.replace('level', 'Level ')} Reward
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                  ₹
                </span>
                <Input
                  id={level}
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => handleConfigChange(level, e.target.value)}
                  className="pl-8"
                  placeholder="0.00"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <div className="text-sm text-muted-foreground mb-4">
            <h3 className="font-semibold mb-2">How it works:</h3>
            <ul className="space-y-1 text-xs">
              <li>• When a user activates their subscription, rewards are distributed up the referral chain</li>
              <li>• Level 1 = Direct referrer, Level 2 = Referrer's referrer, and so on</li>
              <li>• If there's no referrer at any level, the chain stops there</li>
              <li>• Rewards are automatically added to user balances</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button 
            onClick={saveConfig} 
            disabled={saving}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
          <Button 
            onClick={resetToDefaults} 
            variant="outline"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg text-sm">
          <h4 className="font-semibold text-blue-800 mb-2">Current Total Potential Reward:</h4>
          <p className="text-blue-700">
            ₹{Object.values(config).reduce((sum, amount) => sum + amount, 0)} 
            per complete 7-level activation chain
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
