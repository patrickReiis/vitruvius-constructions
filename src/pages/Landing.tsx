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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Vitruvius Constructions</h1>
            </div>
            <LoginArea />
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Main Headline */}
          <div className="space-y-4">
            <h2 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
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
              className="text-lg px-8 py-6 rounded-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              Start Building
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Quick Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Headphones className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Flow State Design</h3>
                <p className="text-sm text-muted-foreground">
                  Put on your headphones and enter a zen-like creative flow while building in 3D
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Intuitive 3D Tools</h3>
                <p className="text-sm text-muted-foreground">
                  Drag, drop, and transform architectural elements with simple, powerful controls
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Users className="h-8 w-8 text-primary" />
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
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Create</span>
              </div>
              <ArrowRight className="h-4 w-4" />
              <div className="flex items-center gap-2">
                <Share className="h-4 w-4 text-primary" />
                <span>Share</span>
              </div>
              <ArrowRight className="h-4 w-4" />
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                <span>React</span>
              </div>
              <ArrowRight className="h-4 w-4" />
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span>Comment</span>
              </div>
            </div>
          </div>

          {/* Tech Badge */}
          <div className="pt-8">
            <Badge variant="secondary" className="text-xs px-3 py-1">
              Built on Nostr • Decentralized • Open Source
            </Badge>
          </div>

          {/* Secondary CTA */}
          <div className="pt-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/gallery')}
              className="text-muted-foreground hover:text-foreground"
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