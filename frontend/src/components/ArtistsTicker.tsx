// Дефолтные имена — показываются если в «Работали с нами» в админке пусто
const DEFAULT_NAMES = [
  'SLAVA MARLOW', 'Toxi$', 'LIZER', 'MAYOT', 'SODA LUV', 'Дора',
  'ДЖИЗУС', 'AUGUST', 'blago white', 'Bushido Zho', 'YUNG TRAPPA', 'DopeVvs',
  'FRIENDLY THUG 52 NGG', 'ALBLAK 52', 'Telly Grave', 'УГАДАЙКТО', 'КУОК',
  'Cudea', 'KOUT', 'Josodo', 'Lottery Billz', 'Hofmannita', '044 Rose',
  'Loco OG Rocka', 'Молодой Платон', 'Ian Hopeless', 'D.masta',
]

interface Props {
  names?: string[]
}

function TickerRow({ artists, reverse }: { artists: string[]; reverse?: boolean }) {
  // Дублируем минимум до 16 элементов чтобы лента была бесконечной
  const minCount = Math.max(16, artists.length * 2)
  const repeated: string[] = []
  while (repeated.length < minCount) repeated.push(...artists)
  const doubled = [...repeated, ...repeated]

  return (
    <div className="overflow-hidden">
      <div
        className={`flex gap-3 ${reverse ? 'ticker-reverse' : 'ticker-forward'}`}
        style={{ width: 'max-content' }}
      >
        {doubled.map((name, i) => (
          <span key={i} className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs font-semibold tracking-widest uppercase text-white/50 whitespace-nowrap">
              {name}
            </span>
            <span className="text-white/20 text-xs">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export function ArtistsTicker({ names }: Props) {
  // Если переданы имена из API — используем их, иначе дефолт
  const list = (names && names.length > 0) ? names : DEFAULT_NAMES

  // Делим на две строки примерно пополам
  const mid = Math.ceil(list.length / 2)
  const row1 = list.slice(0, mid)
  const row2 = list.slice(mid)

  // Если всего пара имён — показываем оба ряда одинаковые
  const r1 = row1.length > 0 ? row1 : list
  const r2 = row2.length > 0 ? row2 : list

  return (
    <div>
      <h3 className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">
        Работали с нами
      </h3>
      <div className="space-y-2 -mx-4 overflow-hidden">
        <TickerRow artists={r1} />
        <TickerRow artists={r2} reverse />
      </div>
    </div>
  )
}
