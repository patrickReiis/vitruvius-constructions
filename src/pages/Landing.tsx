import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoginArea } from '@/components/auth/LoginArea';
import { 
  Building2, 
  Users, 
  Headphones, 
  Sparkles,
  ArrowRight,
  Zap,
  Heart,
  MessageCircle,
  Share
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-red-50/30">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-7 w-7 text-red-500" />
              <h1 className="text-2xl font-bold">Vitruvius Constructions</h1>
            </div>
            <div className="scale-100">
              <LoginArea />
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Main Headline */}
          <div className="space-y-4">
            <h2 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-red-600 via-primary to-red-500 bg-clip-text text-transparent">
              Relax, Build & Engage
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Create stunning 3D architecture while vibing to your favorite music. 
              Share your designs and discover amazing projects from the community.
            </p>
          </div>

          {/* CTA Button */}
          <div className="pt-4">
            <Button 
              onClick={() => navigate('/create')}
              size="lg"
              className="text-lg px-8 py-6 rounded-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-300 group text-white"
            >
              Start Building
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Quick Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-red-50/20 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <Headphones className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold">Flow State Design</h3>
                <p className="text-sm text-muted-foreground">
                  Put on your headphones and enter a zen-like creative flow while building in 3D
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-red-50/20 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <Building2 className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold">Intuitive 3D Tools</h3>
                <p className="text-sm text-muted-foreground">
                  Drag, drop, and transform architectural elements with simple, powerful controls
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-red-50/20 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <Users className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold">Social Discovery</h3>
                <p className="text-sm text-muted-foreground">
                  Scroll down to explore, react to, and comment on amazing community creations
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Experience Flow */}
          <div className="pt-16">
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-red-50 border border-red-100">
                <Sparkles className="h-4 w-4 text-red-500" />
                <span className="font-medium text-red-700">Create</span>
              </div>
              <ArrowRight className="h-4 w-4 text-red-300" />
              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-orange-50 border border-orange-100">
                <Share className="h-4 w-4 text-orange-500" />
                <span className="font-medium text-orange-700">Share</span>
              </div>
              <ArrowRight className="h-4 w-4 text-orange-300" />
              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-pink-50 border border-pink-100">
                <Heart className="h-4 w-4 text-pink-500" />
                <span className="font-medium text-pink-700">React</span>
              </div>
              <ArrowRight className="h-4 w-4 text-pink-300" />
              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-purple-50 border border-purple-100">
                <MessageCircle className="h-4 w-4 text-purple-500" />
                <span className="font-medium text-purple-700">Connect</span>
              </div>
            </div>
          </div>

          {/* Nostr Education with Better Design */}
          <div className="pt-12">
            <div className="flex items-center justify-center gap-4 text-sm">
              <span className="text-muted-foreground">New to Nostr?</span>
              <a 
                href="https://soapbox.pub/blog/nostr101/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <span className="font-medium">Learn Here</span>
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Secondary CTA */}
          <div className="pt-6">
            <Button 
              variant="outline" 
              onClick={() => navigate('/gallery')}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all duration-200"
            >
              Explore Gallery First
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;