import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

interface Item {
  id: string;
  name: string;
  rarity: Rarity;
  value: number;
  stars: number;
  emoji: string;
}

interface Event {
  id: string;
  name: string;
  emoji: string;
  description: string;
  endsAt: number;
  buff: string;
}

interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  costType: 'coins' | 'stars';
  emoji: string;
}

const ITEMS: Item[] = [
  { id: '1', name: 'Тикки', rarity: 'common', value: 5, stars: 1, emoji: '🎮' },
  { id: '2', name: 'Поко', rarity: 'common', value: 5, stars: 1, emoji: '🎸' },
  { id: '3', name: 'Эль Примо', rarity: 'common', value: 5, stars: 1, emoji: '💪' },
  { id: '4', name: 'Джесси', rarity: 'rare', value: 15, stars: 3, emoji: '🔧' },
  { id: '5', name: 'Дайна', rarity: 'rare', value: 15, stars: 3, emoji: '💣' },
  { id: '6', name: 'Биби', rarity: 'epic', value: 40, stars: 8, emoji: '🏏' },
  { id: '7', name: 'Фрэнк', rarity: 'epic', value: 40, stars: 8, emoji: '🔨' },
  { id: '8', name: 'Леон', rarity: 'legendary', value: 120, stars: 25, emoji: '🦎' },
  { id: '9', name: 'Ворон', rarity: 'legendary', value: 120, stars: 25, emoji: '🦅' },
  { id: '10', name: 'Гейл', rarity: 'mythic', value: 300, stars: 50, emoji: '❄️' },
];

const RARITY_CHANCES: Record<Rarity, number> = {
  common: 60,
  rare: 25,
  epic: 10,
  legendary: 4,
  mythic: 1,
};

const SHOP_ITEMS: ShopItem[] = [
  { id: 'mega', name: 'Мега Бокс', description: 'Открой мега бокс с гарантированным эпиком!', cost: 80, costType: 'coins', emoji: '📦' },
  { id: 'gold', name: 'Золотой бустер', description: 'x2 к звездам за продажу (1 час)', cost: 150, costType: 'stars', emoji: '⭐' },
  { id: 'luck', name: 'Клевер удачи', description: 'x3 шанс на легендарку (30 мин)', cost: 200, costType: 'stars', emoji: '🍀' },
];

const RARITY_COLORS: Record<Rarity, string> = {
  common: 'from-gray-500 to-gray-600',
  rare: 'from-blue-500 to-blue-600',
  epic: 'from-purple-500 to-purple-600',
  legendary: 'from-yellow-500 to-amber-600',
  mythic: 'from-pink-500 to-red-600',
};

const RARITY_NAMES: Record<Rarity, string> = {
  common: 'Обычный',
  rare: 'Редкий',
  epic: 'Эпический',
  legendary: 'Легендарный',
  mythic: 'Мифический',
};

export default function Index() {
  const [coins, setCoins] = useState(() => {
    const saved = localStorage.getItem('coins');
    return saved ? parseInt(saved) : 250;
  });
  const [stars, setStars] = useState(() => {
    const saved = localStorage.getItem('stars');
    return saved ? parseInt(saved) : 10;
  });
  const [inventory, setInventory] = useState<Item[]>(() => {
    const saved = localStorage.getItem('inventory');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeTab, setActiveTab] = useState<'roulette' | 'shop' | 'inventory' | 'admin'>('roulette');
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('isAdmin') === 'true');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [rouletteItems, setRouletteItems] = useState<Item[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Event>(() => {
    const saved = localStorage.getItem('currentEvent');
    if (saved) {
      const event = JSON.parse(saved);
      if (Date.now() < event.endsAt) return event;
    }
    const newEvent: Event = {
      id: 'concert',
      name: 'Музыкальный Концерт',
      emoji: '🎵',
      description: 'x2 шанс на редких',
      endsAt: Date.now() + 3600000,
      buff: 'rare_boost',
    };
    localStorage.setItem('currentEvent', JSON.stringify(newEvent));
    return newEvent;
  });
  const [eventTimeLeft, setEventTimeLeft] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem('coins', coins.toString());
  }, [coins]);

  useEffect(() => {
    localStorage.setItem('stars', stars.toString());
  }, [stars]);

  useEffect(() => {
    localStorage.setItem('inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    if (currentEvent) {
      const interval = setInterval(() => {
        const timeLeft = currentEvent.endsAt - Date.now();
        if (timeLeft <= 0) {
          clearInterval(interval);
          const newEvent: Event = {
            id: 'party',
            name: 'Вечеринка',
            emoji: '🎉',
            description: '+50% звезд',
            endsAt: Date.now() + 7200000,
            buff: 'star_boost',
          };
          setCurrentEvent(newEvent);
          localStorage.setItem('currentEvent', JSON.stringify(newEvent));
          toast({ title: '🎊 Новый ивент!', description: `${newEvent.emoji} ${newEvent.name}` });
        } else {
          setEventTimeLeft(timeLeft);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentEvent, toast]);

  const generateRouletteItems = () => {
    const items: Item[] = [];
    for (let i = 0; i < 50; i++) {
      const random = Math.random() * 100;
      let cumulative = 0;
      let selectedRarity: Rarity = 'common';
      
      const eventBoost = currentEvent.buff === 'rare_boost' ? 2 : 1;
      
      for (const [rarity, chance] of Object.entries(RARITY_CHANCES)) {
        const adjustedChance = rarity === 'rare' ? chance * eventBoost : chance;
        cumulative += adjustedChance;
        if (random <= cumulative) {
          selectedRarity = rarity as Rarity;
          break;
        }
      }
      
      const itemsOfRarity = ITEMS.filter(item => item.rarity === selectedRarity);
      const randomItem = itemsOfRarity[Math.floor(Math.random() * itemsOfRarity.length)];
      items.push({ ...randomItem, id: `${randomItem.id}-${i}` });
    }
    return items;
  };

  const spinRoulette = () => {
    if (coins < 10) {
      toast({ title: '❌ Недостаточно монет!', description: 'Нужно минимум 10 монет', variant: 'destructive' });
      return;
    }

    setCoins(coins - 10);
    setIsSpinning(true);
    setShowResult(false);
    
    const items = generateRouletteItems();
    setRouletteItems(items);
    setSelectedIndex(0);
    
    const targetIndex = 45 + Math.floor(Math.random() * 5);
    
    let currentIndex = 0;
    const intervalTime = 50;
    let elapsed = 0;
    const totalDuration = 3000;
    
    const interval = setInterval(() => {
      elapsed += intervalTime;
      const progress = elapsed / totalDuration;
      
      if (progress >= 1) {
        clearInterval(interval);
        setSelectedIndex(targetIndex);
        setIsSpinning(false);
        setShowResult(true);
        
        const wonItem = items[targetIndex];
        setInventory([...inventory, { ...wonItem, id: `${wonItem.id}-${Date.now()}` }]);
        
        toast({
          title: `${wonItem.emoji} ${RARITY_NAMES[wonItem.rarity]}!`,
          description: `${wonItem.name} | 💰${wonItem.value} | ⭐${wonItem.stars}`,
        });
      } else {
        const speed = Math.floor(1 + progress * 5);
        currentIndex = (currentIndex + speed) % items.length;
        setSelectedIndex(currentIndex);
      }
    }, intervalTime);
  };

  const sellItem = (item: Item) => {
    const starBoost = currentEvent.buff === 'star_boost' ? 1.5 : 1;
    const earnedStars = Math.floor(item.stars * starBoost);
    
    setInventory(inventory.filter(inv => inv.id !== item.id));
    setCoins(coins + item.value);
    setStars(stars + earnedStars);
    toast({ title: '💰 Продано!', description: `+${item.value} монет, +${earnedStars}⭐` });
  };

  const buyShopItem = (shopItem: ShopItem) => {
    if (shopItem.costType === 'coins' && coins < shopItem.cost) {
      toast({ title: '❌ Недостаточно монет!', variant: 'destructive' });
      return;
    }
    if (shopItem.costType === 'stars' && stars < shopItem.cost) {
      toast({ title: '❌ Недостаточно звезд!', variant: 'destructive' });
      return;
    }

    if (shopItem.costType === 'coins') {
      setCoins(coins - shopItem.cost);
    } else {
      setStars(stars - shopItem.cost);
    }
    
    toast({ title: `${shopItem.emoji} Куплено!`, description: shopItem.name });
  };

  const checkAdminCode = () => {
    if (adminCode === '123') {
      setIsAdmin(true);
      localStorage.setItem('isAdmin', 'true');
      setShowAdminLogin(false);
      setAdminCode('');
      toast({ title: '🔓 Доступ получен!', description: 'Добро пожаловать, админ!' });
    } else {
      toast({ title: '❌ Неверный код!', variant: 'destructive' });
    }
  };

  const addCoins = (amount: number) => {
    setCoins(coins + amount);
    toast({ title: '💰 Монеты добавлены!', description: `+${amount} монет` });
  };

  const addStars = (amount: number) => {
    setStars(stars + amount);
    toast({ title: '⭐ Звезды добавлены!', description: `+${amount} звезд` });
  };

  const resetProgress = () => {
    setCoins(250);
    setStars(10);
    setInventory([]);
    toast({ title: '🔄 Прогресс сброшен!' });
  };

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}ч ${minutes}м`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-purple-950/20 to-background p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-secondary rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-primary via-secondary to-accent rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-primary/50 animate-bounce-slow">
              🎰
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                RNG Royale
              </h1>
              <p className="text-sm text-muted-foreground">Испытай удачу в королевской рулетке</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Card className="px-4 py-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-yellow-500/50">
              <div className="flex items-center gap-2">
                <span className="text-xl">💰</span>
                <span className="text-xl font-bold">{coins}</span>
              </div>
            </Card>
            <Card className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-cyan-500/50">
              <div className="flex items-center gap-2">
                <span className="text-xl">⭐</span>
                <span className="text-xl font-bold">{stars}</span>
              </div>
            </Card>
            <Button
              onClick={() => setShowAdminLogin(true)}
              variant="outline"
              size="icon"
              className="w-10 h-10"
            >
              {isAdmin ? '👑' : '🔒'}
            </Button>
          </div>
        </div>

        <Card className="mb-6 p-4 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 border-primary/50 animate-glow">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{currentEvent.emoji}</span>
              <div>
                <div className="font-bold text-lg">{currentEvent.name}</div>
                <div className="text-sm text-muted-foreground">{currentEvent.description}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Заканчивается через</div>
              <div className="font-bold">{formatTime(eventTimeLeft)}</div>
            </div>
          </div>
        </Card>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['roulette', 'shop', 'inventory', ...(isAdmin ? ['admin' as const] : [])] as const).map((tab) => (
            <Button
              key={tab}
              onClick={() => setActiveTab(tab)}
              variant={activeTab === tab ? 'default' : 'outline'}
              className="flex-shrink-0 text-base font-semibold px-6"
            >
              {tab === 'roulette' && <Icon name="Sparkles" className="mr-2" />}
              {tab === 'shop' && <Icon name="Store" className="mr-2" />}
              {tab === 'inventory' && <Icon name="Package" className="mr-2" />}
              {tab === 'admin' && <Icon name="Shield" className="mr-2" />}
              {tab === 'roulette' && 'Рулетка'}
              {tab === 'shop' && 'Магазин'}
              {tab === 'inventory' && `Коллекция (${inventory.length})`}
              {tab === 'admin' && 'Админ'}
            </Button>
          ))}
        </div>

        {activeTab === 'roulette' && (
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-card via-card/90 to-card/80 border-2 border-primary/30 overflow-hidden">
              <div className="flex flex-col items-center gap-6">
                <div className="relative w-full max-w-md h-64 bg-background/50 rounded-xl border-4 border-primary/50 overflow-hidden">
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-20 border-y-4 border-accent z-10 pointer-events-none"></div>
                  
                  <div 
                    className="absolute top-0 left-0 w-full transition-transform duration-100 ease-linear"
                    style={{ 
                      transform: `translateY(-${selectedIndex * 80}px)`,
                      paddingTop: '80px'
                    }}
                  >
                    {rouletteItems.map((item, index) => (
                      <div 
                        key={index}
                        className={`h-20 flex items-center justify-center gap-3 border-b border-border/30 ${
                          index === selectedIndex && showResult ? 'bg-primary/30 scale-110' : ''
                        } transition-all`}
                      >
                        <span className="text-4xl">{item.emoji}</span>
                        <div className="text-left">
                          <Badge className={`bg-gradient-to-r ${RARITY_COLORS[item.rarity]} text-white text-xs mb-1`}>
                            {RARITY_NAMES[item.rarity]}
                          </Badge>
                          <div className="font-bold">{item.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button
                  onClick={spinRoulette}
                  disabled={isSpinning || coins < 10}
                  size="lg"
                  className="w-full max-w-xs text-xl font-bold h-16 bg-gradient-to-r from-primary via-secondary to-accent hover:scale-105 transition-transform shadow-lg shadow-primary/50"
                >
                  {isSpinning ? (
                    <>
                      <Icon name="Loader2" className="mr-2 animate-spin" />
                      Крутим...
                    </>
                  ) : (
                    <>
                      <Icon name="Zap" className="mr-2" />
                      Крутить (10 💰)
                    </>
                  )}
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-card/50 border-border/50">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Icon name="TrendingUp" size={20} />
                Шансы выпадения
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(RARITY_CHANCES).map(([rarity, chance]) => (
                  <div key={rarity} className="text-center p-3 rounded-lg bg-background/50 border border-border/30">
                    <Badge className={`bg-gradient-to-r ${RARITY_COLORS[rarity as Rarity]} text-white mb-2`}>
                      {RARITY_NAMES[rarity as Rarity]}
                    </Badge>
                    <div className="text-2xl font-bold text-primary">{chance}%</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="grid gap-4 md:grid-cols-2">
            {SHOP_ITEMS.map((item) => (
              <Card key={item.id} className="p-6 bg-gradient-to-br from-card to-card/60 border-primary/30 hover:scale-105 hover:border-primary/60 transition-all">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-6xl">{item.emoji}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => buyShopItem(item)}
                    disabled={(item.costType === 'coins' && coins < item.cost) || (item.costType === 'stars' && stars < item.cost)}
                    size="lg"
                    className="w-full bg-gradient-to-r from-primary to-secondary"
                  >
                    <Icon name="ShoppingCart" className="mr-2" />
                    {item.cost} {item.costType === 'coins' ? '💰' : '⭐'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div>
            {inventory.length === 0 ? (
              <Card className="p-16 text-center bg-card/50">
                <div className="text-8xl mb-6">📦</div>
                <p className="text-2xl font-bold mb-2">Коллекция пуста</p>
                <p className="text-muted-foreground">Крути рулетку чтобы получить персонажей!</p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {inventory.map((item) => (
                  <Card key={item.id} className={`p-4 bg-gradient-to-br from-card to-card/50 border-2 hover:scale-105 transition-all border-${RARITY_COLORS[item.rarity].split(' ')[0].replace('from-', '')}`}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-6xl">{item.emoji}</div>
                      <Badge className={`bg-gradient-to-r ${RARITY_COLORS[item.rarity]} text-white`}>
                        {RARITY_NAMES[item.rarity]}
                      </Badge>
                      <div className="text-center font-bold text-sm">{item.name}</div>
                      <div className="text-xs text-muted-foreground">💰{item.value} | ⭐{item.stars}</div>
                      <Button
                        onClick={() => sellItem(item)}
                        size="sm"
                        className="w-full bg-gradient-to-r from-accent to-secondary"
                      >
                        <Icon name="Sparkles" className="mr-1" size={14} />
                        Продать
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'admin' && isAdmin && (
          <div className="space-y-4">
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Icon name="Shield" size={24} />
                Админ-панель
              </h2>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button onClick={() => addCoins(100)} className="bg-gradient-to-r from-amber-500 to-yellow-500">
                    <Icon name="Plus" className="mr-2" />
                    +100 💰
                  </Button>
                  <Button onClick={() => addCoins(1000)} className="bg-gradient-to-r from-amber-600 to-yellow-600">
                    <Icon name="Plus" className="mr-2" />
                    +1000 💰
                  </Button>
                  <Button onClick={() => addStars(50)} className="bg-gradient-to-r from-blue-500 to-cyan-500">
                    <Icon name="Plus" className="mr-2" />
                    +50 ⭐
                  </Button>
                  <Button onClick={() => addStars(200)} className="bg-gradient-to-r from-blue-600 to-cyan-600">
                    <Icon name="Plus" className="mr-2" />
                    +200 ⭐
                  </Button>
                </div>
                <Button onClick={resetProgress} variant="destructive" className="w-full">
                  <Icon name="RotateCcw" className="mr-2" />
                  Сбросить весь прогресс
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-card/50">
              <h3 className="text-lg font-semibold mb-4">Статистика</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between p-3 bg-background/50 rounded-lg">
                  <span className="text-muted-foreground">Монет:</span>
                  <span className="font-bold">💰 {coins}</span>
                </div>
                <div className="flex justify-between p-3 bg-background/50 rounded-lg">
                  <span className="text-muted-foreground">Звезд:</span>
                  <span className="font-bold">⭐ {stars}</span>
                </div>
                <div className="flex justify-between p-3 bg-background/50 rounded-lg">
                  <span className="text-muted-foreground">Персонажей:</span>
                  <span className="font-bold">📦 {inventory.length}</span>
                </div>
                <div className="flex justify-between p-3 bg-background/50 rounded-lg">
                  <span className="text-muted-foreground">Ивент:</span>
                  <span className="font-bold">{currentEvent.emoji} {currentEvent.name}</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      <Dialog open={showAdminLogin} onOpenChange={setShowAdminLogin}>
        <DialogContent className="bg-card border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Icon name="Lock" size={24} />
              Вход в админ-панель
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Введите код доступа"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && checkAdminCode()}
              className="text-lg"
            />
            <Button
              onClick={checkAdminCode}
              className="w-full bg-gradient-to-r from-primary to-secondary"
            >
              <Icon name="LogIn" className="mr-2" />
              Войти
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
