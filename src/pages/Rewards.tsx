import React from 'react';
import Seo from "@/components/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";
import { ReferralLevelsDisplay } from "@/components/referral/ReferralLevelsDisplay";
import { Gift, Info, Star, Trophy, Target } from "lucide-react";

const Rewards = () => {
  return (
    <>
      <Seo title="Referral Rewards" description="Earn amazing rewards and cash prizes through our referral program" />

      <SubscriptionGuard feature="referral system">
        <div className="container py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mb-4">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">MATRATV CARE Referral Rewards</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join our amazing referral program and earn incredible rewards, cash prizes, and exclusive gifts!
            </p>
          </div>

          {/* New 7-Level Fixed Reward System */}
          <ReferralLevelsDisplay />

          {/* Key Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Amazing Rewards</h3>
                <p className="text-sm text-muted-foreground">
                  Earn household items, electronics, and even cars!
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Cash Prizes</h3>
                <p className="text-sm text-muted-foreground">
                  Earn up to ₹40 Lakh cash rewards for top referrers
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Easy to Achieve</h3>
                <p className="text-sm text-muted-foreground">
                  Start earning with just 20 referrals!
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Kit Rewards Chart */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Monthly Kit Rewards (छोटी किट - 1 महीना)
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Earn wonderful household gifts based on your monthly kit purchases
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <img 
                    src="https://cdn.builder.io/api/v1/image/assets%2F3330cc0b3ce9490191d7a410f4213f9c%2F73deadd38d6c4d5f95bed5f31ba4b436?format=webp&width=800"
                    alt="Monthly Kit Rewards Chart"
                    className="w-full rounded-lg border shadow-lg"
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Reward Breakdown</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-blue-50 p-4 rounded-lg border">
                      <div className="font-bold text-blue-700">₹100</div>
                      <div className="text-blue-600">घड़ी (Watch)</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg border">
                      <div className="font-bold text-orange-700">₹200</div>
                      <div className="text-orange-600">प्रेस (Iron)</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border">
                      <div className="font-bold text-green-700">₹300</div>
                      <div className="text-green-600">तवा (डोसा का) (Tawa)</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border">
                      <div className="font-bold text-purple-700">₹400</div>
                      <div className="text-purple-600">डिनर सेट (Dinner Set)</div>
                    </div>
                    <div className="bg-pink-50 p-4 rounded-lg border">
                      <div className="font-bold text-pink-700">₹500</div>
                      <div className="text-pink-600">12 पीस की बोतलें (12 Bottles)</div>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg border">
                      <div className="font-bold text-indigo-700">₹1000</div>
                      <div className="text-indigo-600">बच्चों की साइकल (Kids Cycle)</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sanitary Pads Chart */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Sanitary Pads Chart (1 महीना)
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Special rewards for sanitary pad kit purchases
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <img 
                    src="https://cdn.builder.io/api/v1/image/assets%2F3330cc0b3ce9490191d7a410f4213f9c%2F925f68a2de644ca29b4a2da15692c314?format=webp&width=800"
                    alt="Sanitary Pads Chart"
                    className="w-full rounded-lg border shadow-lg"
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Reward Details</h3>
                  <div className="overflow-hidden rounded-lg border shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-3 text-left border-b">क्रमांक</th>
                          <th className="p-3 text-left border-b">किट मात्रा</th>
                          <th className="p-3 text-left border-b">उपहार</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-3 border-b text-center font-medium">1</td>
                          <td className="p-3 border-b text-center">100 किट</td>
                          <td className="p-3 border-b text-center font-medium text-green-600">1 कुलर</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="p-3 border-b text-center font-medium">2</td>
                          <td className="p-3 border-b text-center">200 किट</td>
                          <td className="p-3 border-b text-center font-medium text-green-600">1 इनवर्टर</td>
                        </tr>
                        <tr>
                          <td className="p-3 border-b text-center font-medium">3</td>
                          <td className="p-3 border-b text-center">300 किट</td>
                          <td className="p-3 border-b text-center font-medium text-green-600">1 A.C</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MATRATV CARE Sponsor Rewards */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                MATRATV CARE Sponsor Rewards Program
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Our most prestigious reward program - Sponsor ID is your Referral ID
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <img 
                    src="https://cdn.builder.io/api/v1/image/assets%2F3330cc0b3ce9490191d7a410f4213f9c%2Ff3f190855fa046c4be9b1f145498594a?format=webp&width=800"
                    alt="MATRATV CARE Sponsor Rewards"
                    className="w-full rounded-lg border shadow-lg"
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Sponsor Reward Tiers</h3>
                  <div className="overflow-hidden rounded-lg border shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="bg-gradient-to-r from-purple-100 to-blue-100">
                        <tr>
                          <th className="p-3 text-left border-b">Sponsor ID</th>
                          <th className="p-3 text-left border-b">Income</th>
                          <th className="p-3 text-left border-b">Rewards</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-3 border-b font-medium">20 ID</td>
                          <td className="p-3 border-b font-medium">₹300</td>
                          <td className="p-3 border-b">
                            <Badge className="bg-green-100 text-green-700">₹200 Cash</Badge>
                          </td>
                        </tr>
                        <tr className="bg-blue-50">
                          <td className="p-3 border-b font-medium">200 ID</td>
                          <td className="p-3 border-b font-medium">₹2,200</td>
                          <td className="p-3 border-b">
                            <Badge className="bg-green-100 text-green-700">₹3,200 Cash</Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 border-b font-medium">2,000 ID</td>
                          <td className="p-3 border-b font-medium">₹18,000</td>
                          <td className="p-3 border-b">
                            <Badge className="bg-blue-100 text-blue-700">₹2,000 Cash / Tablet</Badge>
                          </td>
                        </tr>
                        <tr className="bg-blue-50">
                          <td className="p-3 border-b font-medium">20,000 ID</td>
                          <td className="p-3 border-b font-medium">₹1,40,000</td>
                          <td className="p-3 border-b">
                            <Badge className="bg-purple-100 text-purple-700">₹1 Lakh / Activa</Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 border-b font-medium">2 LAKH ID</td>
                          <td className="p-3 border-b font-medium">₹10,00,000</td>
                          <td className="p-3 border-b">
                            <Badge className="bg-gold-100 text-yellow-700">₹15 Lakh Cash / Car</Badge>
                          </td>
                        </tr>
                        <tr className="bg-gradient-to-r from-yellow-50 to-orange-50">
                          <td className="p-3 border-b font-bold">20 LAKH ID</td>
                          <td className="p-3 border-b font-bold">₹60,00,000</td>
                          <td className="p-3 border-b">
                            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">₹40 Lakh Cash / Dream House</Badge>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                How the Referral Rewards Program Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-semibold">Getting Started</h3>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-blue-600">1</span>
                      </div>
                      <div>
                        <p className="font-medium">Register & Get Your Sponsor ID</p>
                        <p className="text-sm text-muted-foreground">Your Sponsor ID is your unique Referral ID</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-blue-600">2</span>
                      </div>
                      <div>
                        <p className="font-medium">Share Your Referral Link</p>
                        <p className="text-sm text-muted-foreground">Invite friends and family to join MATRATV CARE</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-blue-600">3</span>
                      </div>
                      <div>
                        <p className="font-medium">Earn Rewards</p>
                        <p className="text-sm text-muted-foreground">Get cash and gifts as your network grows</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Key Benefits</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <p className="text-sm">Earn ₹15 per referral at 20 ID level</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <p className="text-sm">Monthly kit rewards for consistent purchases</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <p className="text-sm">Special sanitary pad kit rewards</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <p className="text-sm">Ultimate goal: ₹40 Lakh cash / Dream House</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <p className="text-sm">No limits on earnings potential</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </SubscriptionGuard>
    </>
  );
};

export default Rewards;
