import { useEffect, useState } from 'react';

interface Props {
  value: number;
  min: number;
  max: number;
  // clamp: valores fora da faixa sao ajustados; sem clamp, sao ignorados.
  clamp?: boolean;
  onCommit: (v: number) => void;
}

const parse = (t: string) => (t.trim() === '' ? NaN : Number(t.trim().replace(',', '.')));

// Campo numerico com texto local: aceita "," ou ".", so confirma valores validos e
// ao sair do campo mostra de novo o valor confirmado.
export default function NumberField({ value, min, max, clamp = false, onCommit }: Props) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    if (parse(text) !== value) setText(String(value));
    // so quando o valor muda por fora (ex.: resetar)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        const v = parse(e.target.value);
        if (!Number.isFinite(v)) return;
        if (clamp) onCommit(Math.min(max, Math.max(min, v)));
        else if (v >= min && v <= max) onCommit(v);
      }}
      onBlur={() => setText(String(value))}
    />
  );
}
