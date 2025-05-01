import {
  HTMLAttributes,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type Setter<T> = (value: T | ((value: T) => T)) => void;

const ArtifactSlotContext = createContext<{
  open: [string | null, Setter<string | null>];
  mounted: [string | null, Setter<string | null>];

  title: [HTMLElement | null, Setter<HTMLElement | null>];
  content: [HTMLElement | null, Setter<HTMLElement | null>];

  context: [Record<string, unknown>, Setter<Record<string, unknown>>];
}>(null!);

const ArtifactFill = (props: {
  id: string;
  children?: ReactNode;
  title?: ReactNode;
}) => {
  const context = useContext(ArtifactSlotContext);

  const [ctxMounted, ctxSetMounted] = context.mounted;
  const [content] = context.content;
  const [title] = context.title;

  const isMounted = ctxMounted === props.id;
  const isEmpty = props.children == null && props.title == null;

  useEffect(() => {
    if (isEmpty) {
      ctxSetMounted((open) => (open === props.id ? null : open));
    }
  }, [isEmpty, ctxSetMounted, props.id]);

  if (!isMounted) return null;
  return (
    <>
      {title != null ? createPortal(<>{props.title}</>, title) : null}
      {content != null ? createPortal(<>{props.children}</>, content) : null}
    </>
  );
};

export function ArtifactContent(props: HTMLAttributes<HTMLDivElement>) {
  const context = useContext(ArtifactSlotContext);

  const [mounted] = context.mounted;
  const ref = useRef<HTMLDivElement>(null);
  const [, setStateRef] = context.content;

  useLayoutEffect(
    () => setStateRef?.(mounted ? ref.current : null),
    [setStateRef, mounted],
  );

  if (!mounted) return null;
  return (
    <div
      {...props}
      ref={ref}
    />
  );
}

export function ArtifactTitle(props: HTMLAttributes<HTMLDivElement>) {
  const context = useContext(ArtifactSlotContext);

  const ref = useRef<HTMLDivElement>(null);
  const [, setStateRef] = context.title;

  useLayoutEffect(() => setStateRef?.(ref.current), [setStateRef]);

  return (
    <div
      {...props}
      ref={ref}
    />
  );
}

export function ArtifactProvider(props: { children?: ReactNode }) {
  const content = useState<HTMLElement | null>(null);
  const title = useState<HTMLElement | null>(null);

  const open = useState<string | null>(null);
  const mounted = useState<string | null>(null);
  const context = useState<Record<string, unknown>>({});

  return (
    <ArtifactSlotContext.Provider
      value={{ open, mounted, title, content, context }}
    >
      {props.children}
    </ArtifactSlotContext.Provider>
  );
}

export function useArtifact() {
  const id = useId();
  const context = useContext(ArtifactSlotContext);
  const [ctxOpen, ctxSetOpen] = context.open;
  const [ctxContext, ctxSetContext] = context.context;
  const [, ctxSetMounted] = context.mounted;

  const open = ctxOpen === id;
  const setOpen = useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      if (typeof value === "boolean") {
        ctxSetOpen(value ? id : null);
      } else {
        ctxSetOpen((open) => (open === id ? null : id));
      }

      ctxSetMounted(id);
    },
    [ctxSetOpen, ctxSetMounted, id],
  );

  const ArtifactContent = useCallback(
    (props: { title?: React.ReactNode; children: React.ReactNode }) => {
      return (
        <ArtifactFill
          id={id}
          title={props.title}
        >
          {props.children}
        </ArtifactFill>
      );
    },
    [id],
  );

  return {
    open,
    setOpen,
    context: ctxContext,
    setContext: ctxSetContext,
    content: ArtifactContent,
  };
}

export function useArtifactOpen() {
  const context = useContext(ArtifactSlotContext);
  const [ctxOpen, setCtxOpen] = context.open;

  const open = ctxOpen !== null;
  const onClose = useCallback(() => setCtxOpen(null), [setCtxOpen]);

  return [open, onClose] as const;
}

export function useArtifactContext() {
  const context = useContext(ArtifactSlotContext);
  return context.context;
}
