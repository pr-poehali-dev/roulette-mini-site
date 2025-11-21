import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

type Rarity = 'common' | 'uncommon';

interface Item {
  id: string;
  name: string;
  rarity: Rarity;
  value: number;
  emoji: string;
}

interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  emoji: string;
  duration: number;
}

const ITEMS: Item[] = [
  { id: '1', name: 'Старая монета', rarity: 'common', value: 3, emoji: '🪙' },
  { id: '2', name: 'Деревянный меч', rarity: 'common', value: 3, emoji: '🗡️' },
  { id: '3', name: 'Зелье', rarity: 'common', value: 3, emoji: '🧪' },
  { id: '4', name: 'Кристалл', rarity: 'common', value: 3, emoji: '💎' },
  { id: '5', name: 'Золотой слиток', rarity: 'uncommon', value: 10, emoji: '🏅' },
  { id: '6', name: 'Магический шар', rarity: 'uncommon', value: 10, emoji: '🔮' },
  { id: '7', name: 'Корона', rarity: 'uncommon', value: 10, emoji: '👑' },
];

const SHOP_ITEMS: ShopItem[] = [
  { id: 'luck', name: 'Удача x2', description: 'Удваивает шансы на редкие предметы', cost: 50, emoji: '🍀', duration: 300000 },
  { id: 'speed', name: 'Ускорение', description: 'Быстрее крутишь рулетку', cost: 30, emoji: '⚡', duration: 180000 },
];

export default function Index() {
  const [coins, setCoins] = useState(() => {
    const saved = localStorage.getItem('coins');
    return saved ? parseInt(saved) : 100;
  });
  const [inventory, setInventory] = useState<Item[]>(() => {
    const saved = localStorage.getItem('inventory');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeTab, setActiveTab] = useState<'roulette' | 'shop' | 'inventory'>('roulette');
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [activeBuff, setActiveBuff] = useState<string | null>(() => {
    const saved = localStorage.getItem('activeBuff');
    const expiry = localStorage.getItem('buffExpiry');
    if (saved && expiry && Date.now() < parseInt(expiry)) {
      return saved;
    }
    return null;
  });
  const [buffTimeLeft, setBuffTimeLeft] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem('coins', coins.toString());
  }, [coins]);

  useEffect(() => {
    localStorage.setItem('inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    if (activeBuff) {
      const expiry = localStorage.getItem('buffExpiry');
      if (expiry) {
        const timeLeft = parseInt(expiry) - Date.now();
        if (timeLeft > 0) {
          setBuffTimeLeft(timeLeft);
          const interval = setInterval(() => {
            const newTimeLeft = parseInt(expiry) - Date.now();
            if (newTimeLeft <= 0) {
              setActiveBuff(null);
              localStorage.removeItem('activeBuff');
              localStorage.removeItem('buffExpiry');
              clearInterval(interval);
              toast({ title: '⏰ Бафф закончился!', description: 'Купи новый в магазине' });
            } else {
              setBuffTimeLeft(newTimeLeft);
            }
          }, 1000);
          return () => clearInterval(interval);
        }
      }
    }
  }, [activeBuff, toast]);

  const spinRoulette = () => {
    if (coins < 10) {
      toast({ title: '❌ Недостаточно монет!', description: 'Нужно минимум 10 монет', variant: 'destructive' });
      return;
    }

    setIsSpinning(true);
    setCoins(coins - 10);

    setTimeout(() => {
      const luckBoost = activeBuff === 'luck' ? 2 : 1;
      const random = Math.random() * 100;
      const uncommonChance = 40 * luckBoost;

      const rarity: Rarity = random < uncommonChance ? 'uncommon' : 'common';
      const itemsOfRarity = ITEMS.filter(item => item.rarity === rarity);
      const wonItem = itemsOfRarity[Math.floor(Math.random() * itemsOfRarity.length)];

      setCurrentItem(wonItem);
      setInventory([...inventory, { ...wonItem, id: `${wonItem.id}-${Date.now()}` }]);
      setIsSpinning(false);

      toast({
        title: rarity === 'uncommon' ? '🎉 Редкий предмет!' : '✨ Выпал предмет!',
        description: `${wonItem.emoji} ${wonItem.name} (+${wonItem.value} монет)`,
      });
    }, 2000);
  };

  const sellItem = (item: Item) => {
    setInventory(inventory.filter(inv => inv.id !== item.id));
    setCoins(coins + item.value);
    toast({ title: '💰 Продано!', description: `+${item.value} монет` });
  };

  const buyBuff = (shopItem: ShopItem) => {
    if (coins < shopItem.cost) {
      toast({ title: '❌ Недостаточно монет!', variant: 'destructive' });
      return;
    }
    if (activeBuff) {
      toast({ title: '⚠️ Уже активен бафф!', description: 'Дождись окончания текущего', variant: 'destructive' });
      return;
    }

    setCoins(coins - shopItem.cost);
    setActiveBuff(shopItem.id);
    const expiry = Date.now() + shopItem.duration;
    localStorage.setItem('activeBuff', shopItem.id);
    localStorage.setItem('buffExpiry', expiry.toString());
    toast({ title: `${shopItem.emoji} Куплено!`, description: shopItem.name });
  };

  const rarityColors = {
    common: 'bg-gray-500',
    uncommon: 'bg-gradient-to-r from-primary to-secondary',
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-accent to-secondary rounded-full flex items-center justify-center text-2xl animate-bounce-slow">
              🎰
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Рулетка удачи
            </h1>
          </div>
          <Card className="px-6 py-3 bg-gradient-to-r from-accent to-accent/80 border-accent">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💰</span>
              <span className="text-2xl font-bold text-white">{coins}</span>
            </div>
          </Card>
        </div>

        {activeBuff && (
          <Card className="mb-6 p-4 bg-gradient-to-r from-primary/20 to-secondary/20 border-primary animate-glow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{SHOP_ITEMS.find(s => s.id === activeBuff)?.emoji}</span>
                <div>
                  <div className="font-semibold">{SHOP_ITEMS.find(s => s.id === activeBuff)?.name} активен</div>
                  <div className="text-sm text-muted-foreground">Осталось: {formatTime(buffTimeLeft)}</div>
                </div>
              </div>
              <Progress value={(buffTimeLeft / (SHOP_ITEMS.find(s => s.id === activeBuff)?.duration || 1)) * 100} className="w-32" />
            </div>
          </Card>
        )}

        <div className="flex gap-2 mb-6">
          {(['roulette', 'shop', 'inventory'] as const).map((tab) => (
            <Button
              key={tab}
              onClick={() => setActiveTab(tab)}
              variant={activeTab === tab ? 'default' : 'outline'}
              className="flex-1 text-lg font-semibold"
            >
              {tab === 'roulette' && <Icon name="Sparkles" className="mr-2" />}
              {tab === 'shop' && <Icon name="ShoppingBag" className="mr-2" />}
              {tab === 'inventory' && <Icon name="Package" className="mr-2" />}
              {tab === 'roulette' && 'Рулетка'}
              {tab === 'shop' && 'Магазин'}
              {tab === 'inventory' && `Инвентарь (${inventory.length})`}
            </Button>
          ))}
        </div>

        {activeTab === 'roulette' && (
          <div className="space-y-6">
            <Card className="p-8 bg-gradient-to-br from-card to-card/50">
              <div className="flex flex-col items-center gap-6">
                <div className={`w-48 h-48 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center text-8xl ${isSpinning ? 'animate-spin-slow' : ''}`}>
                  {currentItem ? currentItem.emoji : '🎲'}
                </div>
                <div className="text-center">
                  {currentItem && !isSpinning && (
                    <div className="space-y-2">
                      <Badge className={`${rarityColors[currentItem.rarity]} text-white text-lg px-4 py-1`}>
                        {currentItem.rarity === 'common' ? 'Обычный' : 'Редкий'}
                      </Badge>
                      <div className="text-2xl font-bold">{currentItem.name}</div>
                      <div className="text-lg text-muted-foreground">+{currentItem.value} монет</div>
                    </div>
                  )}
                </div>
                <Button
                  onClick={spinRoulette}
                  disabled={isSpinning || coins < 10}
                  size="lg"
                  className="w-full max-w-xs text-xl font-bold h-14 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                >
                  {isSpinning ? (
                    <>
                      <Icon name="Loader2" className="mr-2 animate-spin" />
                      Крутим...
                    </>
                  ) : (
                    <>
                      <Icon name="Play" className="mr-2" />
                      Крутить (10 монет)
                    </>
                  )}
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-card/50">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Icon name="Info" size={20} />
                Шансы выпадения
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gray-500 text-white">Обычный</Badge>
                    <span className="text-sm">3 монеты</span>
                  </div>
                  <span className="text-2xl font-bold text-muted-foreground">60%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gradient-to-r from-primary to-secondary text-white">Редкий</Badge>
                    <span className="text-sm">10 монет</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">40%</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="grid gap-4">
            {SHOP_ITEMS.map((item) => (
              <Card key={item.id} className="p-6 bg-gradient-to-br from-card to-card/50 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">{item.emoji}</div>
                    <div>
                      <h3 className="text-xl font-bold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Длительность: {formatTime(item.duration)}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => buyBuff(item)}
                    disabled={coins < item.cost || !!activeBuff}
                    size="lg"
                    className="bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70"
                  >
                    <Icon name="ShoppingCart" className="mr-2" />
                    {item.cost} 💰
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div>
            {inventory.length === 0 ? (
              <Card className="p-12 text-center bg-card/50">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-xl text-muted-foreground">Инвентарь пуст</p>
                <p className="text-sm text-muted-foreground mt-2">Крути рулетку чтобы получить предметы!</p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {inventory.map((item) => (
                  <Card key={item.id} className="p-4 bg-gradient-to-br from-card to-card/50 hover:scale-105 transition-transform">
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-5xl">{item.emoji}</div>
                      <Badge className={`${rarityColors[item.rarity]} text-white`}>
                        {item.rarity === 'common' ? 'Обычный' : 'Редкий'}
                      </Badge>
                      <div className="text-center font-semibold">{item.name}</div>
                      <Button
                        onClick={() => sellItem(item)}
                        size="sm"
                        className="w-full bg-gradient-to-r from-accent to-secondary hover:from-accent/90 hover:to-secondary/90"
                      >
                        <Icon name="DollarSign" className="mr-1" size={16} />
                        Продать {item.value}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
