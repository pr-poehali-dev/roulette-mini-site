import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'divine';

interface Pet {
  id: string;
  name: string;
  rarity: Rarity;
  coinsPerSec: number;
  stars: number;
  emoji: string;
}

interface Event {
  id: string;
  name: string;
  emoji: string;
  multiplier: number;
  chance: number;
}

interface LuckyBlock {
  id: string;
  name: string;
  emoji: string;
  drops: { petId: string; chance: number }[];
}

const PETS: Pet[] = [
  { id: '1', name: 'Котик Бомбинитос', rarity: 'common', coinsPerSec: 1, stars: 1, emoji: '🐱' },
  { id: '2', name: 'Песик Флаффи', rarity: 'common', coinsPerSec: 1, stars: 1, emoji: '🐶' },
  { id: '3', name: 'Кролик Прыгуша', rarity: 'rare', coinsPerSec: 3, stars: 3, emoji: '🐰' },
  { id: '4', name: 'Панда Чилл', rarity: 'rare', coinsPerSec: 3, stars: 3, emoji: '🐼' },
  { id: '5', name: 'Дракон Пламя', rarity: 'epic', coinsPerSec: 8, stars: 8, emoji: '🐉' },
  { id: '6', name: 'Феникс Рождение', rarity: 'epic', coinsPerSec: 8, stars: 8, emoji: '🔥' },
  { id: '7', name: 'Единорог Радуга', rarity: 'legendary', coinsPerSec: 25, stars: 25, emoji: '🦄' },
  { id: '8', name: 'Грифон Небесный', rarity: 'legendary', coinsPerSec: 25, stars: 25, emoji: '🦅' },
  { id: '9', name: 'Космо-Кот', rarity: 'mythic', coinsPerSec: 70, stars: 50, emoji: '🌌' },
  { id: '10', name: 'Радужный Слайм', rarity: 'mythic', coinsPerSec: 70, stars: 50, emoji: '🌈' },
  { id: '11', name: 'Крупук Паги-Паги', rarity: 'divine', coinsPerSec: 500, stars: 800, emoji: '👑' },
  { id: 'lb1', name: 'Лос Бомбинитос', rarity: 'common', coinsPerSec: 2, stars: 2, emoji: '💣' },
  { id: 'lb2', name: 'Крупужи Стоунини', rarity: 'rare', coinsPerSec: 5, stars: 5, emoji: '💎' },
  { id: 'lb3', name: '67 Лаки Блок Админский', rarity: 'divine', coinsPerSec: 777, stars: 999, emoji: '🎁' },
];

const RARITY_CHANCES: Record<Rarity, number> = {
  common: 50,
  rare: 25,
  epic: 15,
  legendary: 7,
  mythic: 2.8,
  divine: 0.2,
};

const EVENTS: Event[] = [
  { id: 'cometstrike', name: 'Кометный Удар', emoji: '☄️', multiplier: 5, chance: 12.7 },
  { id: 'starrain', name: 'Звездный Дождь', emoji: '⭐', multiplier: 5, chance: 12.7 },
  { id: 'disco', name: 'Диско Мания', emoji: '🪩', multiplier: 9, chance: 6.742 },
];

const LUCKY_BLOCKS: LuckyBlock[] = [
  {
    id: 'lb_six_seven',
    name: 'Лаки Блок 6-7',
    emoji: '🎲',
    drops: [
      { petId: 'lb1', chance: 70 },
      { petId: 'lb2', chance: 25 },
      { petId: 'lb3', chance: 5 },
    ],
  },
];

const RARITY_COLORS: Record<Rarity, string> = {
  common: 'from-gray-500 to-gray-600',
  rare: 'from-blue-500 to-blue-600',
  epic: 'from-purple-500 to-purple-600',
  legendary: 'from-yellow-500 to-amber-600',
  mythic: 'from-pink-500 to-red-600',
  divine: 'from-cyan-400 via-purple-500 to-pink-500',
};

const RARITY_NAMES: Record<Rarity, string> = {
  common: 'Обычный',
  rare: 'Редкий',
  epic: 'Эпический',
  legendary: 'Легендарный',
  mythic: 'Мифический',
  divine: 'БОЖЕСТВЕННЫЙ',
};

export default function Index() {
  const [coins, setCoins] = useState(() => {
    const saved = localStorage.getItem('coins');
    return saved ? parseFloat(saved) : 500;
  });
  const [stars, setStars] = useState(() => {
    const saved = localStorage.getItem('stars');
    return saved ? parseInt(saved) : 10;
  });
  const [inventory, setInventory] = useState<Pet[]>(() => {
    const saved = localStorage.getItem('inventory');
    return saved ? JSON.parse(saved) : [];
  });
  const [equippedPets, setEquippedPets] = useState<Pet[]>(() => {
    const saved = localStorage.getItem('equippedPets');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeTab, setActiveTab] = useState<'roulette' | 'shop' | 'inventory' | 'admin'>('roulette');
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('isAdmin') === 'true');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [rouletteItems, setRouletteItems] = useState<Pet[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(() => {
    const random = Math.random() * 100;
    let cumulative = 0;
    for (const event of EVENTS) {
      cumulative += event.chance;
      if (random <= cumulative) {
        return event;
      }
    }
    return null;
  });
  const [coinsPerSecond, setCoinsPerSecond] = useState(0);
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
    localStorage.setItem('equippedPets', JSON.stringify(equippedPets));
  }, [equippedPets]);

  useEffect(() => {
    const total = equippedPets.reduce((sum, pet) => sum + pet.coinsPerSec, 0);
    setCoinsPerSecond(total);
  }, [equippedPets]);

  useEffect(() => {
    if (coinsPerSecond > 0) {
      const interval = setInterval(() => {
        setCoins((prev) => prev + coinsPerSecond);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [coinsPerSecond]);

  const generateRouletteItems = () => {
    const items: Pet[] = [];
    for (let i = 0; i < 50; i++) {
      const random = Math.random() * 100;
      let cumulative = 0;
      let selectedRarity: Rarity = 'common';
      
      const eventMultiplier = currentEvent ? currentEvent.multiplier : 1;
      
      for (const [rarity, chance] of Object.entries(RARITY_CHANCES)) {
        const adjustedChance = ['legendary', 'mythic', 'divine'].includes(rarity) 
          ? chance * eventMultiplier 
          : chance;
        cumulative += adjustedChance;
        if (random <= cumulative) {
          selectedRarity = rarity as Rarity;
          break;
        }
      }
      
      const petsOfRarity = PETS.filter(pet => pet.rarity === selectedRarity && !pet.id.startsWith('lb'));
      if (petsOfRarity.length > 0) {
        const randomPet = petsOfRarity[Math.floor(Math.random() * petsOfRarity.length)];
        items.push({ ...randomPet, id: `${randomPet.id}-${i}` });
      }
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
        
        const wonPet = items[targetIndex];
        setInventory([...inventory, { ...wonPet, id: `${wonPet.id}-${Date.now()}` }]);
        
        toast({
          title: `${wonPet.emoji} ${RARITY_NAMES[wonPet.rarity]}!`,
          description: `${wonPet.name} | ${wonPet.coinsPerSec}/сек | ⭐${wonPet.stars}`,
        });
      } else {
        const speed = Math.floor(1 + progress * 5);
        currentIndex = (currentIndex + speed) % items.length;
        setSelectedIndex(currentIndex);
      }
    }, intervalTime);
  };

  const openLuckyBlock = () => {
    if (coins < 50) {
      toast({ title: '❌ Недостаточно монет!', description: 'Лаки блок стоит 50 монет', variant: 'destructive' });
      return;
    }

    setCoins(coins - 50);
    
    const block = LUCKY_BLOCKS[0];
    const random = Math.random() * 100;
    let cumulative = 0;
    let selectedPetId = block.drops[0].petId;
    
    for (const drop of block.drops) {
      cumulative += drop.chance;
      if (random <= cumulative) {
        selectedPetId = drop.petId;
        break;
      }
    }
    
    const wonPet = PETS.find(p => p.id === selectedPetId);
    if (wonPet) {
      setInventory([...inventory, { ...wonPet, id: `${wonPet.id}-${Date.now()}` }]);
      toast({
        title: `${wonPet.emoji} ${RARITY_NAMES[wonPet.rarity]}!`,
        description: `${wonPet.name} из Лаки Блока!`,
      });
    }
  };

  const equipPet = (pet: Pet) => {
    if (equippedPets.length >= 5) {
      toast({ title: '⚠️ Лимит достигнут!', description: 'Максимум 5 петов могут работать', variant: 'destructive' });
      return;
    }
    setEquippedPets([...equippedPets, pet]);
    setInventory(inventory.filter(p => p.id !== pet.id));
    toast({ title: '✅ Пет работает!', description: `${pet.name} приносит ${pet.coinsPerSec} монет/сек` });
  };

  const unequipPet = (pet: Pet) => {
    setEquippedPets(equippedPets.filter(p => p.id !== pet.id));
    setInventory([...inventory, pet]);
    toast({ title: '📦 Пет убран', description: `${pet.name} вернулся в инвентарь` });
  };

  const sellPet = (pet: Pet) => {
    setInventory(inventory.filter(p => p.id !== pet.id));
    setStars(stars + pet.stars);
    toast({ title: '💫 Продано!', description: `+${pet.stars}⭐` });
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
    setCoins(500);
    setStars(10);
    setInventory([]);
    setEquippedPets([]);
    toast({ title: '🔄 Прогресс сброшен!' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-purple-950/20 to-background p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-secondary rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-4xl shadow-lg shadow-primary/50 animate-bounce-slow">
              🎮
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Pet Farm Brainrot
              </h1>
              <p className="text-sm text-muted-foreground">Собери всех петов и фарми монеты!</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <Card className="px-4 py-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-yellow-500/50">
              <div className="flex items-center gap-2">
                <span className="text-xl">💰</span>
                <span className="text-xl font-bold">{Math.floor(coins)}</span>
              </div>
              <div className="text-xs text-muted-foreground text-center">+{coinsPerSecond}/сек</div>
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

        {currentEvent && (
          <Card className="mb-6 p-4 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 border-purple-500/50 animate-glow">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{currentEvent.emoji}</span>
              <div className="flex-1">
                <div className="font-bold text-xl">{currentEvent.name}</div>
                <div className="text-sm text-muted-foreground">x{currentEvent.multiplier} шанс на редкие петы! ({currentEvent.chance}%)</div>
              </div>
            </div>
          </Card>
        )}

        {equippedPets.length > 0 && (
          <Card className="mb-6 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/50">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="font-bold text-lg mb-2">🔥 Активные петы ({equippedPets.length}/5)</div>
                <div className="flex gap-2 flex-wrap">
                  {equippedPets.map(pet => (
                    <Badge 
                      key={pet.id} 
                      className={`bg-gradient-to-r ${RARITY_COLORS[pet.rarity]} text-white cursor-pointer`}
                      onClick={() => unequipPet(pet)}
                    >
                      {pet.emoji} {pet.name} (+{pet.coinsPerSec}/с)
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">+{coinsPerSecond} 💰/сек</div>
                <div className="text-xs text-muted-foreground">Кликни чтобы убрать</div>
              </div>
            </div>
          </Card>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['roulette', 'shop', 'inventory', ...(isAdmin ? ['admin' as const] : [])] as const).map((tab) => (
            <Button
              key={tab}
              onClick={() => setActiveTab(tab)}
              variant={activeTab === tab ? 'default' : 'outline'}
              className="flex-shrink-0 text-base font-semibold px-6"
            >
              {tab === 'roulette' && <Icon name="Sparkles" className="mr-2" />}
              {tab === 'shop' && <Icon name="Gift" className="mr-2" />}
              {tab === 'inventory' && <Icon name="Package" className="mr-2" />}
              {tab === 'admin' && <Icon name="Shield" className="mr-2" />}
              {tab === 'roulette' && 'Рулетка'}
              {tab === 'shop' && 'Лаки Блоки'}
              {tab === 'inventory' && `Петы (${inventory.length})`}
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
                    {rouletteItems.map((pet, index) => (
                      <div 
                        key={index}
                        className={`h-20 flex items-center justify-center gap-3 border-b border-border/30 ${
                          index === selectedIndex && showResult ? 'bg-primary/30 scale-110' : ''
                        } transition-all`}
                      >
                        <span className="text-4xl">{pet.emoji}</span>
                        <div className="text-left">
                          <Badge className={`bg-gradient-to-r ${RARITY_COLORS[pet.rarity]} text-white text-xs mb-1`}>
                            {RARITY_NAMES[pet.rarity]}
                          </Badge>
                          <div className="font-bold text-sm">{pet.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button
                  onClick={spinRoulette}
                  disabled={isSpinning || coins < 10}
                  size="lg"
                  className="w-full max-w-xs text-xl font-bold h-16 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:scale-105 transition-transform shadow-lg"
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
                Шансы выпадения {currentEvent && `(Ивент: x${currentEvent.multiplier})`}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(RARITY_CHANCES).map(([rarity, chance]) => {
                  const multiplier = currentEvent && ['legendary', 'mythic', 'divine'].includes(rarity) ? currentEvent.multiplier : 1;
                  const finalChance = chance * multiplier;
                  return (
                    <div key={rarity} className="text-center p-3 rounded-lg bg-background/50 border border-border/30">
                      <Badge className={`bg-gradient-to-r ${RARITY_COLORS[rarity as Rarity]} text-white mb-2 text-xs`}>
                        {RARITY_NAMES[rarity as Rarity]}
                      </Badge>
                      <div className="text-xl font-bold text-primary">{finalChance.toFixed(1)}%</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="space-y-6">
            <Card className="p-8 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/50 hover:scale-105 transition-all">
              <div className="flex flex-col items-center gap-6">
                <div className="text-8xl">{LUCKY_BLOCKS[0].emoji}</div>
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-2">{LUCKY_BLOCKS[0].name}</h2>
                  <p className="text-muted-foreground mb-4">Открой чтобы получить специального пета!</p>
                  <div className="grid gap-2 text-sm mb-6">
                    {LUCKY_BLOCKS[0].drops.map((drop) => {
                      const pet = PETS.find(p => p.id === drop.petId);
                      return pet ? (
                        <div key={drop.petId} className="flex items-center justify-between p-2 bg-background/50 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{pet.emoji}</span>
                            <span>{pet.name}</span>
                          </div>
                          <Badge className={`bg-gradient-to-r ${RARITY_COLORS[pet.rarity]}`}>
                            {drop.chance}%
                          </Badge>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
                <Button
                  onClick={openLuckyBlock}
                  disabled={coins < 50}
                  size="lg"
                  className="w-full max-w-md text-2xl font-bold h-20 bg-gradient-to-r from-amber-500 to-orange-500"
                >
                  <Icon name="Gift" className="mr-2" />
                  Открыть (50 💰)
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div>
            {inventory.length === 0 ? (
              <Card className="p-16 text-center bg-card/50">
                <div className="text-8xl mb-6">📦</div>
                <p className="text-2xl font-bold mb-2">Нет петов</p>
                <p className="text-muted-foreground">Крути рулетку чтобы получить петов!</p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {inventory.map((pet) => (
                  <Card key={pet.id} className="p-4 bg-gradient-to-br from-card to-card/50 border-2 hover:scale-105 transition-all">
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-6xl">{pet.emoji}</div>
                      <Badge className={`bg-gradient-to-r ${RARITY_COLORS[pet.rarity]} text-white text-xs`}>
                        {RARITY_NAMES[pet.rarity]}
                      </Badge>
                      <div className="text-center font-bold text-sm">{pet.name}</div>
                      <div className="text-xs text-muted-foreground">💰+{pet.coinsPerSec}/сек | ⭐{pet.stars}</div>
                      <div className="grid grid-cols-2 gap-2 w-full">
                        <Button
                          onClick={() => equipPet(pet)}
                          size="sm"
                          disabled={equippedPets.length >= 5}
                          className="bg-gradient-to-r from-green-500 to-emerald-500"
                        >
                          <Icon name="Play" className="mr-1" size={12} />
                          Фарм
                        </Button>
                        <Button
                          onClick={() => sellPet(pet)}
                          size="sm"
                          variant="outline"
                        >
                          <Icon name="DollarSign" className="mr-1" size={12} />
                          ⭐{pet.stars}
                        </Button>
                      </div>
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
                  <Button onClick={() => addCoins(1000)} className="bg-gradient-to-r from-amber-500 to-yellow-500">
                    <Icon name="Plus" className="mr-2" />
                    +1000 💰
                  </Button>
                  <Button onClick={() => addCoins(10000)} className="bg-gradient-to-r from-amber-600 to-yellow-600">
                    <Icon name="Plus" className="mr-2" />
                    +10k 💰
                  </Button>
                  <Button onClick={() => addStars(100)} className="bg-gradient-to-r from-blue-500 to-cyan-500">
                    <Icon name="Plus" className="mr-2" />
                    +100 ⭐
                  </Button>
                  <Button onClick={() => addStars(1000)} className="bg-gradient-to-r from-blue-600 to-cyan-600">
                    <Icon name="Plus" className="mr-2" />
                    +1k ⭐
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
                  <span className="font-bold">💰 {Math.floor(coins)}</span>
                </div>
                <div className="flex justify-between p-3 bg-background/50 rounded-lg">
                  <span className="text-muted-foreground">Звезд:</span>
                  <span className="font-bold">⭐ {stars}</span>
                </div>
                <div className="flex justify-between p-3 bg-background/50 rounded-lg">
                  <span className="text-muted-foreground">Петов:</span>
                  <span className="font-bold">📦 {inventory.length}</span>
                </div>
                <div className="flex justify-between p-3 bg-background/50 rounded-lg">
                  <span className="text-muted-foreground">Фарм:</span>
                  <span className="font-bold">🔥 +{coinsPerSecond}/сек</span>
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
