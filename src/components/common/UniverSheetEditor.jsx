import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { createUniver, LocaleType, mergeLocales } from "@univerjs/presets";
import { UniverSheetsCorePreset } from "@univerjs/preset-sheets-core";
import UniverPresetSheetsCoreEnUS from "@univerjs/preset-sheets-core/locales/en-US";
import "@univerjs/preset-sheets-core/lib/index.css";

const UniverSheetEditor = forwardRef(function UniverSheetEditor(
  { initialSnapshot, readOnly, className },
  ref,
) {
  const containerRef = useRef(null);
  const univerApiRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getSnapshot() {
      return univerApiRef.current?.getActiveWorkbook()?.save() ?? null;
    },
  }));

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const { univerAPI } = createUniver({
      locale: LocaleType.EN_US,
      locales: {
        [LocaleType.EN_US]: mergeLocales(UniverPresetSheetsCoreEnUS),
      },
      presets: [
        UniverSheetsCorePreset({
          container: containerRef.current,
        }),
      ],
    });

    univerApiRef.current = univerAPI;
    const workbook = univerAPI.createWorkbook(initialSnapshot || {});
    if (readOnly) workbook.setEditable(false);

    return () => {
      univerAPI.dispose();
      univerApiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className={className} />;
});

export default UniverSheetEditor;
