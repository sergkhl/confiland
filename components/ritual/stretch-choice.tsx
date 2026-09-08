import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { Slider } from '@base-ui/react/slider';
import { EFFORTS, type Effort } from '@/lib/challenges';
import {
  stretchEffort,
  stretchPreview,
  StretchGesture,
} from '@/lib/stretch-choice';

export function StretchChoice({
  value,
  effort,
  onChoose,
  onBalloon,
}: {
  value?: number;
  effort: Effort | null;
  onChoose: (value: number) => boolean;
  onBalloon: (label: string | null) => void;
}) {
  const gesture = useRef(new StretchGesture(value, effort));
  const [preview, setPreview] = useState(() => stretchPreview(value, effort));
  const [touched, setTouched] = useState(false);
  const label =
    touched || value !== undefined
      ? EFFORTS[stretchEffort(preview)]
      : 'Your call.';
  useEffect(() => {
    onBalloon(label);
  }, [label, onBalloon]);
  useEffect(() => () => onBalloon(null), [onBalloon]);
  const help = useId();
  const cancel = () => {
    setPreview(gesture.current.cancel());
    setTouched(false);
  };
  const choose = (position: number) => {
    if (!onChoose(position)) cancel();
  };
  return (
    <div
      className="stretch-choice"
      data-touched={touched}
      style={{ '--stretch-height': `${10 + preview / 10}px` } as CSSProperties}
    >
      <p id={help} className="stretch-help">
        Drag to show how hard it would be for you.
      </p>
      <Slider.Root
        className="stretch-slider"
        min={0}
        max={100}
        step={0.1}
        largeStep={5}
        value={preview}
        thumbAlignment="edge"
        onValueChange={(next) => {
          setPreview(gesture.current.preview(next));
          setTouched(true);
        }}
        onPointerDownCapture={(event) => {
          if (event.button === 0)
            gesture.current.begin(event.pointerId, event.isPrimary);
        }}
        onPointerUpCapture={(event) => {
          const position = gesture.current.release(event.pointerId);
          if (position !== null) choose(position);
        }}
        onPointerCancel={cancel}
        onKeyDownCapture={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            cancel();
          } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            if (!event.repeat) choose(gesture.current.value);
          } else {
            const position = gesture.current.key(event.key);
            if (position !== null) {
              event.preventDefault();
              event.stopPropagation();
              setPreview(position);
              setTouched(true);
            }
          }
        }}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) cancel();
        }}
      >
        <Slider.Control className="stretch-control">
          <Slider.Track className="stretch-track">
            <Slider.Indicator className="stretch-fill" />
          </Slider.Track>
          <Slider.Thumb
            className="stretch-thumb"
            aria-label="Anticipated effort"
            aria-describedby={help}
            getAriaValueText={(_formatted, position) =>
              `${EFFORTS[stretchEffort(position)]}. Preview; press Enter to choose.`
            }
          >
            <span aria-hidden="true">↔</span>
          </Slider.Thumb>
        </Slider.Control>
      </Slider.Root>
      <span className="sr-only">
        Use arrow keys to preview, Home or End for either end, then Enter or
        Space to choose. Escape cancels. You can also tap the track.
      </span>
    </div>
  );
}
