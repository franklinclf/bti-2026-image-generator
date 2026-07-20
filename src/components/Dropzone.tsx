import {
  useRef,
  useState,
  type DragEvent,
  type ChangeEvent,
  type CSSProperties,
} from 'react';
import { useApp } from '../state';

interface DropzoneProps {
  // Modo compacto p/ usar dentro da toolbar (rotulo menor).
  compact?: boolean;
}

// Area de drag-drop + input file multiplo. Repassa os arquivos p/ addFiles.
export default function Dropzone({ compact = false }: DropzoneProps) {
  const { addFiles } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function onFiles(files: FileList | null) {
    if (files && files.length) addFiles(files);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    onFiles(e.dataTransfer.files);
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!dragging) setDragging(true);
  }

  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    onFiles(e.target.files);
    // Limpa p/ permitir re-selecionar os mesmos arquivos.
    e.target.value = '';
  }

  function openPicker() {
    inputRef.current?.click();
  }

  // Estilo pontual (sem depender de classe .dropzone no css).
  const base: CSSProperties = {
    border: `1px dashed ${dragging ? 'var(--gold-bright)' : 'var(--line-strong)'}`,
    borderRadius: 10,
    background: dragging ? 'rgba(212,175,55,0.08)' : 'var(--navy-850)',
    color: 'var(--ink-dim)',
    cursor: 'pointer',
    transition: 'border-color .15s, background .15s',
    textAlign: 'center',
    userSelect: 'none',
  };

  const style: CSSProperties = compact
    ? { ...base, padding: '8px 14px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }
    : { ...base, padding: '32px 24px', fontSize: 14, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openPicker}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openPicker();
        }
      }}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      style={style}
      title="Clique ou arraste as fotos aqui"
    >
      {compact ? (
        <span>
          <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>+ Importar fotos</strong>
        </span>
      ) : (
        <>
          <strong style={{ color: 'var(--ink)', fontWeight: 600, fontSize: 16 }}>
            Arraste as fotos aqui
          </strong>
          <span>
            ou clique para selecionar (arquivos <span className="mono">Nome_Sobrenome.jpg</span>)
          </span>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
