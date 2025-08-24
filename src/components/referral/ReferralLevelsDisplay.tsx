import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Users, DollarSign, TrendingUp, Award } from 'lucide-react'
import { useAuth } from '@/context/NewAuthContext'
import { countReferralsByLevel, getReferralsByLevel, loadRewardConfig, DEFAULT_REFERRAL_REWARD_CONFIG } from '@/lib/fixed-reward-system'
import { toast } from '@/hooks/use-toast'

interface ReferralLevel {
  level: number
  rewardAmount: number
  count: number
  totalEarned: number
  referrals: any[]
}

export const ReferralLevelsDisplay: React.FC = () => {
  const { user, profile } = useAuth()
  const [levels, setLevels] = useState<ReferralLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [rewardConfig, setRewardConfig] = useState(DEFAULT_REFERRAL_REWARD_CONFIG)
  const [totalStats, setTotalStats] = useState({
    totalReferrals: 0,
    totalEarnings: 0,
    directReferrals: 0
  })

  useEffect(() => {
    if (user?.id) {
      loadReferralData()
    }
  }, [user?.id])

  const loadReferralData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)

      // Load reward configuration
      const config = await loadRewardConfig()
      setRewardConfig(config)

      // Get counts for each level
      const levelCounts = await countReferralsByLevel(user.id)

      // Get detailed referral data for each level
      const referralsByLevel = await getReferralsByLevel(user.id)
      
      // Create level data
      const levelData: ReferralLevel[] = []
      let totalReferrals = 0
      let totalEarnings = 0
      
      for (let level = 1; level <= 7; level++) {
        const rewardKey = `level${level}` as keyof typeof DEFAULT_REFERRAL_REWARD_CONFIG
        const rewardAmount = config[rewardKey]
        const count = levelCounts[level] || 0
        const referrals = referralsByLevel[level] || []
        const totalEarned = referrals.reduce((sum, ref) => sum + (ref.commission_amount || 0), 0)
        
        levelData.push({
          level,
          rewardAmount,
          count,
          totalEarned,
          referrals
        })
        
        totalReferrals += count
        totalEarnings += totalEarned
      }
      
      setLevels(levelData)
      setTotalStats({
        totalReferrals,
        totalEarnings: profile?.total_earnings || 0, // Use actual profile total earnings
        directReferrals: levelCounts[1] || 0
      })
      
    } catch (error) {
      console.error('Error loading referral data:', error)
      toast({
        description: 'Failed to load referral data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getLevelColor = (level: number) => {
    const colors = [
      'bg-green-100 text-green-800',
      'bg-blue-100 text-blue-800', 
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-yellow-100 text-yellow-800'
    ]
    return colors[level - 1] || 'bg-gray-100 text-gray-800'
  }

  const getLevelIcon = (level: number) => {
    if (level === 1) return <Users className="h-4 w-4" />
    if (level <= 3) return <TrendingUp className="h-4 w-4" />
    if (level <= 5) return <DollarSign className="h-4 w-4" />
    return <Award className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading referral data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
                <p className="text-2xl font-bold">{totalStats.totalReferrals}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Direct Referrals</p>
                <p className="text-2xl font-bold">{totalStats.directReferrals}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-2xl font-bold">₹{totalStats.totalEarnings}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reward Structure Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            7-Level Fixed Reward Structure
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Earn rewards when users in your referral chain activate their subscriptions
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {levels.map((levelData) => (
              <div
                key={levelData.level}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <Badge className={getLevelColor(levelData.level)}>
                    Level {levelData.level}
                  </Badge>
                  {getLevelIcon(levelData.level)}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Reward Amount</span>
                    <span className="font-bold text-green-600">₹{levelData.rewardAmount}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Referrals</span>
                    <span className="font-semibold">{levelData.count}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Earned</span>
                    <span className="font-semibold text-blue-600">₹{levelData.totalEarned}</span>
                  </div>
                  
                  {levelData.count > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        {levelData.count} × ₹{levelData.rewardAmount} = ₹{levelData.count * levelData.rewardAmount}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How the Fixed Reward System Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-green-600">When You Earn Rewards</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>When someone you referred activates their subscription</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>When someone in your 7-level network activates their subscription</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Rewards are automatically added to your balance</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-blue-600">Reward Distribution</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Level 1 (Direct):</span>
                  <span className="font-semibold">₹200</span>
                </div>
                <div className="flex justify-between">
                  <span>Level 2:</span>
                  <span className="font-semibold">₹15</span>
                </div>
                <div className="flex justify-between">
                  <span>Level 3:</span>
                  <span className="font-semibold">₹11</span>
                </div>
                <div className="flex justify-between">
                  <span>Level 4:</span>
                  <span className="font-semibold">₹9</span>
                </div>
                <div className="flex justify-between">
                  <span>Level 5:</span>
                  <span className="font-semibold">₹7</span>
                </div>
                <div className="flex justify-between">
                  <span>Level 6:</span>
                  <span className="font-semibold">₹5</span>
                </div>
                <div className="flex justify-between">
                  <span>Level 7:</span>
                  <span className="font-semibold">₹3</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={loadReferralData} variant="outline">
          <TrendingUp className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>
    </div>
  )
}
