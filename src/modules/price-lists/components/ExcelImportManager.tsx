import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as xlsx from "xlsx";
import {
  X,
  CloudUpload,
  Database,
  Building2,
  Table as TableIcon,
  ChevronDown,
  Layers,
  Sparkles,
  Zap,
  Loader2,
  FileSpreadsheet,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
} from "lucide-react";
import { neuroToast } from "../../../shared/utils/neuroToast";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000/api";

interface ExcelImportManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialBrand?: string;
}

interface ProcessedProduct {
  _tempId?: string;
  sku: string;
  name: string;
  costPrice: number;
  stock: number;
  metadata: {
    cashPriceRaw: number;
    installments2Raw: number;
    installments3Raw: number;
    installments6Raw: number;
    installments12Raw: number;
    lastListUpdate: string;
  };
}

const formatToArgentineDate = (isoString: string) => {
  if (!isoString) return "";
  if (isoString.includes("/")) return isoString;
  const parts = isoString.split("-");
  if (parts.length >= 3) {
    return `${parts[2].substring(0, 2)}/${parts[1]}/${parts[0]}`;
  }
  return isoString;
};

// 🧠 IA: ESCÁNER PROFUNDO DE FECHAS
const detectDateInGrid = (data: unknown[][]): string => {
  let foundDate = "";
  for (let i = 0; i < Math.min(30, data.length); i++) {
    const row = data[i] as unknown[];
    for (let j = 0; j < row.length; j++) {
      const cell = row[j];
      if (typeof cell === "string") {
        const dateMatch = cell
          .trim()
          .match(/(\d{4}-\d{2}-\d{2})|(\d{1,2}\/\d{1,2}\/\d{2,4})/);
        if (dateMatch) {
          foundDate = dateMatch[0];
          break;
        }
      } else if (typeof cell === "number" && cell > 40000 && cell < 50000) {
        const dateObj = new Date((cell - (25567 + 2)) * 86400 * 1000);
        foundDate = dateObj.toISOString().split("T")[0];
        break;
      }
    }
    if (foundDate) break;
  }
  return foundDate || new Date().toISOString().split("T")[0];
};

export const ExcelImportManager: React.FC<ExcelImportManagerProps> = ({
  isOpen,
  onClose,

  onSuccess,
  initialBrand = "ALL",
}) => {
  const token = localStorage.getItem("club_token");

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [workbook, setWorkbook] = useState<xlsx.WorkBook | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>("");
  const [gridData, setGridData] = useState<unknown[][]>([]);
  const [detectedDate, setDetectedDate] = useState<string>("");

  const [suppliers, setSuppliers] = useState<
    { id: number; companyName: string }[]
  >([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>(
    initialBrand !== "ALL" ? initialBrand : "",
  );

  const [startRow, setStartRow] = useState<number>(0);
  const [isBulkMode, setIsBulkMode] = useState<boolean>(true);
  const [bulkProgress, setBulkProgress] = useState({
    total: 0,
    current: 0,
    brand: "",
  });

  const [columnMap, setColumnMap] = useState<Record<string, number>>({
    sku: -1,
    name: -1,
    costPrice: -1,
    cashPrice: -1,
    installments2: -1,
    installments3: -1,
    installments6: -1,
    installments12: -1,
    stock: -1,
  });

  const [extractedData, setExtractedData] = useState<
    Record<string, ProcessedProduct[]>
  >({});

  const [inspectingBrand, setInspectingBrand] = useState<string | null>(null);
  const [reassignToBrand, setReassignToBrand] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🧠 IA: Ordenamos proveedores por longitud de manera descendente
  const sortedSuppliers = useMemo(() => {
    return [...suppliers].sort(
      (a, b) => b.companyName.length - a.companyName.length,
    );
  }, [suppliers]);

  useEffect(() => {
    if (isOpen) {
      fetch(`${API_URL}/suppliers?limit=3000`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) =>
          setSuppliers(Array.isArray(data) ? data : data.data || []),
        )
        .catch((err) => console.error("Error:", err));

      if (initialBrand !== "ALL") {
        setSelectedSupplier(initialBrand);
        setIsBulkMode(false);
      }
    }
  }, [isOpen, token, initialBrand]);

  const resetState = useCallback(() => {
    setStep(1);
    setWorkbook(null);
    setFileName("");
    setSheetNames([]);
    setActiveSheet("");
    setGridData([]);
    setDetectedDate("");
    setStartRow(0);
    setBulkProgress({ total: 0, current: 0, brand: "" });
    setColumnMap({
      sku: -1,
      name: -1,
      costPrice: -1,
      cashPrice: -1,
      installments2: -1,
      installments3: -1,
      installments6: -1,
      installments12: -1,
      stock: -1,
    });
    setSelectedSupplier(initialBrand !== "ALL" ? initialBrand : "");
    setExtractedData({});
    setInspectingBrand(null);
    setReassignToBrand("");
  }, [initialBrand]);

  const handleClose = useCallback(() => {
    if (step === 4) return;
    resetState();
    onClose();
  }, [step, resetState, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && step !== 4 && !inspectingBrand)
        handleClose();
      if (e.key === "Escape" && inspectingBrand) setInspectingBrand(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, step, inspectingBrand, handleClose]);

  const [isDragging, setIsDragging] = useState(false);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0)
      processFile(e.dataTransfer.files[0]);
  };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const arrayBuffer = evt.target?.result;
        const wb = xlsx.read(arrayBuffer, { type: "array" });
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);

        let targetSheet = wb.SheetNames[0];
        if (selectedSupplier && !isBulkMode) {
          const match = wb.SheetNames.find((s) =>
            s.toLowerCase().includes(selectedSupplier.toLowerCase()),
          );
          if (match) targetSheet = match;
        }

        loadSheetData(wb, targetSheet);
        setStep(2);
      } catch (error) {
        console.error("Read Error:", error);
        neuroToast(
          "Error de lectura",
          "error",
          "El archivo Excel está corrupto.",
        );
        resetState();
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // 🔬 MOTOR ETL: SCORING Y DETECCIÓN DE ESTRUCTURA
  const detectDataStructure = useCallback((data: unknown[][]) => {
    const maxScan = Math.min(40, data.length);
    let headerZoneEnd = 0;

    for (let i = 0; i < maxScan; i++) {
      const row = data[i] as unknown[];
      const textCells = row.filter(
        (c) => typeof c === "string" && isNaN(Number(c)),
      ).length;
      const numericCells = row.filter(
        (c) =>
          typeof c === "number" ||
          (!isNaN(Number(c)) && String(c).trim() !== ""),
      ).length;

      if (textCells > numericCells) headerZoneEnd = i;
      else if (headerZoneEnd > 0) break;
    }

    const startRowVal = headerZoneEnd + 1;
    const colCount = Math.max(
      ...data
        .slice(startRowVal, startRowVal + 15)
        .map((r) => (r as unknown[]).length),
      1,
    );

    const scores: Record<string, number[]> = {
      name: new Array(colCount).fill(0),
      costPrice: new Array(colCount).fill(0),
      cashPrice: new Array(colCount).fill(0),
      installments2: new Array(colCount).fill(0),
      installments3: new Array(colCount).fill(0),
      installments6: new Array(colCount).fill(0),
      installments12: new Array(colCount).fill(0),
      sku: new Array(colCount).fill(0),
      stock: new Array(colCount).fill(0),
    };

    for (let col = 0; col < colCount; col++) {
      let headerText = "";
      for (let r = 0; r <= headerZoneEnd; r++) {
        const val = (data[r] as unknown[])[col];
        if (typeof val === "string") headerText += " " + val.toLowerCase();
      }
      headerText = headerText.trim();
      if (!headerText) continue;

      if (headerText.match(/descrip|nombre|producto|articulo/))
        scores.name[col] += 5;
      if (headerText.match(/precio|lista|costo|neto/))
        scores.costPrice[col] += 5;
      if (headerText.match(/efectivo|contado|desc/)) scores.cashPrice[col] += 5;
      if (headerText.match(/2.*cuot|2.*pago/)) scores.installments2[col] += 5;
      if (headerText.match(/3.*cuot|3.*pago/)) scores.installments3[col] += 5;
      if (headerText.match(/6.*cuot|6.*pago/)) scores.installments6[col] += 5;
      if (headerText.match(/12|ahora/)) scores.installments12[col] += 5;
      if (headerText.match(/sku|cod/)) scores.sku[col] += 5;
      if (headerText.match(/stock|cant/)) scores.stock[col] += 5;
    }

    for (let col = 0; col < colCount; col++) {
      let stringCount = 0;
      let numberCount = 0;
      for (let r = startRowVal; r < startRowVal + 15 && r < data.length; r++) {
        const val = (data[r] as unknown[])[col];
        if (
          typeof val === "string" &&
          isNaN(Number(val)) &&
          val.trim().length > 3
        )
          stringCount++;
        if (
          typeof val === "number" ||
          (!isNaN(Number(val)) && String(val).trim() !== "")
        )
          numberCount++;
      }
      if (stringCount > numberCount) scores.name[col] += 3;
      if (numberCount > stringCount) scores.costPrice[col] += 2;
    }

    const resolve = (key: string) => {
      const arr = scores[key];
      const max = Math.max(...arr);
      return max > 0 ? arr.indexOf(max) : -1;
    };

    return {
      startRow: startRowVal,
      mappedCols: {
        name: resolve("name"),
        costPrice: resolve("costPrice"),
        cashPrice: resolve("cashPrice"),
        installments2: resolve("installments2"),
        installments3: resolve("installments3"),
        installments6: resolve("installments6"),
        installments12: resolve("installments12"),
        sku: resolve("sku"),
        stock: resolve("stock"),
      },
    };
  }, []);

  const loadSheetData = useCallback(
    (wb: xlsx.WorkBook, sheetName: string) => {
      setActiveSheet(sheetName);
      const ws = wb.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json<unknown[]>(ws, {
        header: 1,
        defval: "",
      });
      setGridData(data);

      const { startRow: newStartRow, mappedCols } = detectDataStructure(data);
      const rawDate = detectDateInGrid(data);

      setDetectedDate(formatToArgentineDate(rawDate));
      setStartRow(newStartRow);
      setColumnMap(mappedCols);
    },
    [detectDataStructure],
  );

  const handleSupplierSelect = (supplierName: string) => {
    setSelectedSupplier(supplierName);
    if (!workbook || supplierName.length < 3) return;
    const match = workbook.SheetNames.find((s) =>
      s.toLowerCase().includes(supplierName.toLowerCase()),
    );
    if (match && match !== activeSheet) {
      loadSheetData(workbook, match);
    }
  };

  const classifyRow = (row: unknown[]) => {
    const values = row.filter((v) => v !== "" && v !== null && v !== undefined);
    if (values.length === 0) return "empty";

    let textCount = 0;
    let numCount = 0;
    values.forEach((v) => {
      if (typeof v === "string" && isNaN(Number(v))) textCount++;
      if (
        typeof v === "number" ||
        (!isNaN(Number(v)) && String(v).trim() !== "")
      )
        numCount++;
    });

    if (values.length <= 3 && textCount >= 1 && numCount === 0)
      return "subtitle";
    if (textCount >= 1 && numCount >= 1) return "product";
    return "unknown";
  };

  // 🧠 IA: MOTOR FUZZY DE MARCAS (TOKENIZACIÓN Y PALABRAS CLAVE)
  const fuzzyMatchBrand = useCallback(
    (textToSearch: string) => {
      if (!textToSearch) return null;
      const text = textToSearch.toLowerCase().trim();

      for (const sup of sortedSuppliers) {
        const dbBrand = sup.companyName.toLowerCase().trim();

        // 1. Coincidencia directa
        if (text.includes(dbBrand) || dbBrand.includes(text))
          return sup.companyName;

        // 2. Tokenización estricta para evitar falsos positivos
        const ignoreWords = [
          "distribuidora",
          "pinturas",
          "srl",
          "sa",
          "pintureria",
          "de",
          "los",
          "las",
          "el",
          "la",
        ];
        const dbTokens = dbBrand
          .split(" ")
          .filter((w) => w.length > 3 && !ignoreWords.includes(w));

        for (const token of dbTokens) {
          if (text.includes(token)) return sup.companyName;
        }
      }
      return null;
    },
    [sortedSuppliers],
  );

  // 🧠 FASE DE ANÁLISIS (Preview Staging Area)
  const handleAnalyzeData = () => {
    if (!isBulkMode && !selectedSupplier) {
      neuroToast("Dato Requerido", "warning", "Seleccioná un proveedor.");
      return;
    }
    if (columnMap.name === -1 || columnMap.costPrice === -1) {
      neuroToast(
        "Faltan datos",
        "error",
        "Revisá que la Descripción y el Precio Lista estén mapeados.",
      );
      return;
    }

    try {
      const allProductsByBrand: Record<string, ProcessedProduct[]> = {};
      const sheetsToProcess = isBulkMode ? sheetNames : [activeSheet];

      sheetsToProcess.forEach((sheet) => {
        const ws = workbook!.Sheets[sheet];
        const rawData = xlsx.utils.sheet_to_json<unknown[]>(ws, {
          header: 1,
          defval: "",
        });

        let localStartRow = startRow;
        let localColMap = columnMap;

        if (isBulkMode) {
          const { startRow: sRow, mappedCols } = detectDataStructure(rawData);
          localStartRow = sRow;
          localColMap = mappedCols;
        }

        const sheetDate = isBulkMode
          ? formatToArgentineDate(detectDateInGrid(rawData))
          : detectedDate;

        // 🧠 ESTADO: Inicializamos el contexto asumiendo primero la MARCA DE LA HOJA
        let currentContextBrand = "Varios";
        if (isBulkMode) {
          const matchedSheet = fuzzyMatchBrand(sheet);
          if (matchedSheet) {
            currentContextBrand = matchedSheet;
          } else {
            // Si FuzzyMatch falló, intentamos hacer un split del nombre de la hoja (ej: "Accesorios.Aquiles" -> "Aquiles")
            const sheetParts = sheet.replace(/[-_.]/g, " ").split(" ");
            for (const part of sheetParts) {
              const match = fuzzyMatchBrand(part);
              if (match) {
                currentContextBrand = match;
                break;
              }
            }
          }
        } else {
          currentContextBrand = selectedSupplier;
        }

        // Variable para recordar la marca "dueña" de la hoja
        const baseSheetBrand = currentContextBrand;

        rawData.forEach((rowRaw, idx) => {
          const row = rowRaw as unknown[];
          const rowType = classifyRow(row);

          // Cambio de Contexto por Subtítulos
          if (isBulkMode && rowType === "subtitle") {
            const possibleBrand = fuzzyMatchBrand(row.join(" "));
            if (possibleBrand) {
              currentContextBrand = possibleBrand;
            } else {
              // Si lee un subtítulo que no reconoce, vuelve a la marca base de la hoja
              currentContextBrand = baseSheetBrand;
            }
            return;
          }

          if (idx < localStartRow) return;
          if (rowType !== "product") return;

          const nameVal = String(row[localColMap.name] || "").trim();
          if (!nameVal || nameVal === "0" || nameVal === "NaN") return;

          const parseNum = (colIndex: number) => {
            if (
              colIndex === -1 ||
              row[colIndex] === undefined ||
              row[colIndex] === ""
            )
              return 0;
            let num = 0;
            if (typeof row[colIndex] === "number") num = Number(row[colIndex]);
            else {
              let str = String(row[colIndex])
                .replace(/[$a-zA-Z\s]/g, "")
                .trim();
              if (str.includes(".") && str.includes(","))
                str = str.replace(/\./g, "").replace(",", ".");
              else if (str.includes(",")) str = str.replace(",", ".");
              num = Number(str);
            }
            return isNaN(num) ? 0 : Math.round(num);
          };

          const costPrice = parseNum(localColMap.costPrice);
          if (costPrice <= 0) return;

          const cashPrice = parseNum(localColMap.cashPrice);
          const inst2 = parseNum(localColMap.installments2);
          let inst3 = parseNum(localColMap.installments3);
          const inst6 = parseNum(localColMap.installments6);
          let inst12 = parseNum(localColMap.installments12);

          if (!inst3 && inst2) inst3 = inst2;
          if (!inst12 && inst6) inst12 = inst6;

          // 🧠 ASIGNACIÓN FINAL:
          // 1. El contexto de la hoja / subtítulo MANDA.
          // 2. Solo si sigue en "Varios", intentamos adivinar por el nombre del producto.
          let finalAssignedBrand = currentContextBrand;
          if (isBulkMode && finalAssignedBrand === "Varios") {
            const brandFromName = fuzzyMatchBrand(nameVal);
            if (brandFromName) finalAssignedBrand = brandFromName;
          }

          if (!allProductsByBrand[finalAssignedBrand])
            allProductsByBrand[finalAssignedBrand] = [];

          allProductsByBrand[finalAssignedBrand].push({
            _tempId: `tmp_${Date.now()}_${idx}_${Math.random()}`,
            sku:
              localColMap.sku !== -1 && row[localColMap.sku]
                ? String(row[localColMap.sku]).trim()
                : `SKU-AUTO-${Date.now()}-${idx}`,
            name: nameVal,
            costPrice,
            stock: parseNum(localColMap.stock),
            metadata: {
              cashPriceRaw: cashPrice,
              installments2Raw: inst2,
              installments3Raw: inst3,
              installments6Raw: inst6,
              installments12Raw: inst12,
              lastListUpdate: sheetDate,
            },
          });
        });
      });

      const cleanData: Record<string, ProcessedProduct[]> = {};
      Object.keys(allProductsByBrand).forEach((b) => {
        if (allProductsByBrand[b].length > 0)
          cleanData[b] = allProductsByBrand[b];
      });

      if (Object.keys(cleanData).length === 0) {
        throw new Error("No se detectaron productos válidos.");
      }

      setExtractedData(cleanData);
      setStep(3);
    } catch (error: unknown) {
      neuroToast(
        "Fallo en Análisis",
        "error",
        error instanceof Error
          ? error.message
          : "El Excel no tiene el formato correcto.",
      );
    }
  };

  // 🧠 REASIGNACIÓN MASIVA
  const handleBulkReassign = () => {
    if (!inspectingBrand || !reassignToBrand) return;

    setExtractedData((prev) => {
      const newData = { ...prev };
      if (!newData[reassignToBrand]) newData[reassignToBrand] = [];
      newData[reassignToBrand] = [
        ...newData[reassignToBrand],
        ...newData[inspectingBrand],
      ];
      delete newData[inspectingBrand];
      return newData;
    });

    neuroToast(
      "Reasignación Exitosa",
      "success",
      `Se movieron los productos a ${reassignToBrand}`,
    );
    setInspectingBrand(null);
    setReassignToBrand("");
  };

  // 🧠 REASIGNACIÓN INDIVIDUAL
  const handleSingleReassign = (
    product: ProcessedProduct,
    sourceBrand: string,
    targetBrand: string,
  ) => {
    if (!targetBrand || sourceBrand === targetBrand) return;

    setExtractedData((prev) => {
      const newData = { ...prev };
      newData[sourceBrand] = newData[sourceBrand].filter(
        (p) => p._tempId !== product._tempId,
      );
      if (newData[sourceBrand].length === 0) delete newData[sourceBrand];

      if (!newData[targetBrand]) newData[targetBrand] = [];
      newData[targetBrand] = [...newData[targetBrand], product];

      return newData;
    });
  };

  // 🚀 INYECCIÓN FINAL DESDE EL PREVIEW A LA BASE DE DATOS
  const handleFinalImport = async () => {
    setStep(4);

    try {
      const brandsToProcess = Object.keys(extractedData);
      let totalImported = 0;
      setBulkProgress({ total: brandsToProcess.length, current: 0, brand: "" });

      for (let i = 0; i < brandsToProcess.length; i++) {
        const brand = brandsToProcess[i];

        const products = extractedData[brand].map((p) => ({
          sku: p.sku,
          name: p.name,
          costPrice: p.costPrice,
          stock: p.stock,
          metadata: p.metadata,
        }));

        setBulkProgress({
          total: brandsToProcess.length,
          current: i + 1,
          brand,
        });

        const payload = {
          supplierName: brand,
          globalMargin: 0,
          globalIva: 21,
          products,
        };

        const response = await fetch(`${API_URL}/products/import`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) continue;
        const result = await response.json();
        totalImported += result.importedCount || 0;
      }

      neuroToast(
        isBulkMode ? "Ingesta Masiva Completada" : "Ingesta Exitosa",
        "success",
        isBulkMode
          ? `Se importaron ${totalImported} productos distribuidos en ${brandsToProcess.length} marcas.`
          : `Se procesaron ${totalImported} artículos.`,
      );
      onSuccess();
      handleClose();
    } catch (error: unknown) {
      console.error("Import Error:", error);
      neuroToast(
        "Fallo de Importación",
        "error",
        "Error al inyectar en la base de datos.",
      );
      setStep(3);
    }
  };

  if (!isOpen) return null;
  const maxCols =
    gridData.length > 0
      ? Math.max(...gridData.slice(0, 50).map((r) => (r as unknown[]).length))
      : 0;
  const colIndices = [...Array(maxCols).keys()];

  const totalExtractedProducts = Object.values(extractedData).reduce(
    (acc, curr) => acc + curr.length,
    0,
  );
  const totalBrands = Object.keys(extractedData).length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="bg-white dark:bg-[#0a0f1c] rounded-[2.5rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 max-h-[95vh]"
        >
          <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#050810] flex justify-between items-center shrink-0">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-brand/10 text-brand rounded-2xl">
                <TableIcon size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                  Smart Grid ETL
                </h2>
                <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mt-1 flex items-center gap-2">
                  <Sparkles size={14} /> IA de Tokenización Activada
                </p>
              </div>
            </div>
            {step !== 4 && (
              <button
                onClick={handleClose}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/20 dark:hover:text-red-400 text-slate-500 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            )}
          </div>

          <div className="p-0 overflow-y-auto custom-scrollbar flex-1 bg-slate-50 dark:bg-transparent flex flex-col relative">
            {step === 1 && (
              <div className="flex flex-col items-center justify-center py-24 px-8">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full max-w-2xl p-16 border-2 border-dashed rounded-[3rem] flex flex-col items-center justify-center cursor-pointer transition-all group ${isDragging ? "bg-emerald-50 dark:bg-emerald-900/20 border-brand shadow-xl shadow-emerald-500/20" : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/40 hover:bg-emerald-500/5 hover:border-emerald-500 shadow-sm"}`}
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "easeInOut",
                    }}
                    className="w-24 h-24 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-6 text-slate-400 group-hover:text-emerald-500 shadow-inner"
                  >
                    <CloudUpload size={48} />
                  </motion.div>
                  <h3 className="text-3xl font-black text-slate-700 dark:text-white mb-3 tracking-tight">
                    Arrastrá tu Excel aquí
                  </h3>
                  <p className="text-sm font-bold text-slate-500 text-center px-10">
                    La IA "Fuzzy Match" detectará distribuidoras complejas
                    mediante palabras clave.
                  </p>
                </motion.div>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col h-full animate-fade-in">
                <div className="p-6 bg-white dark:bg-[#0a0f1c] border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row gap-6 shrink-0">
                  <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col gap-4">
                    <label className="flex items-center text-xs font-black uppercase text-slate-500 tracking-widest">
                      <Zap size={14} className="mr-2 text-amber-500" /> Método
                      de Importación
                    </label>
                    <div className="flex rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 p-1.5 shadow-inner">
                      <button
                        onClick={() => setIsBulkMode(true)}
                        className={`flex-1 py-2.5 text-xs font-black uppercase rounded-xl transition-all ${isBulkMode ? "bg-amber-500 text-white shadow-md shadow-amber-500/20" : "text-slate-500 hover:bg-white dark:hover:bg-slate-700"}`}
                      >
                        ⚡ Masivo Automático
                      </button>
                      <button
                        onClick={() => setIsBulkMode(false)}
                        className={`flex-1 py-2.5 text-xs font-black uppercase rounded-xl transition-all ${!isBulkMode ? "bg-brand text-white shadow-md shadow-brand/20" : "text-slate-500 hover:bg-white dark:hover:bg-slate-700"}`}
                      >
                        📄 Individual (1 Marca)
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col gap-4 justify-center">
                    {!isBulkMode ? (
                      <>
                        <label className="flex items-center text-xs font-black uppercase text-slate-500 tracking-widest">
                          <Building2 size={14} className="mr-2 text-brand" />{" "}
                          Proveedor Específico
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            list="supplier-options"
                            value={selectedSupplier}
                            onChange={(e) =>
                              handleSupplierSelect(e.target.value)
                            }
                            placeholder="Ej: Alba..."
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-brand outline-none transition-all shadow-inner"
                          />
                          <datalist id="supplier-options">
                            {suppliers.map((s) => (
                              <option key={s.id} value={s.companyName} />
                            ))}
                          </datalist>
                          <ChevronDown
                            size={18}
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="h-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-3xl p-5 flex flex-col justify-center">
                        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400 leading-relaxed">
                          <Sparkles size={18} className="inline mr-2 mb-1" />
                          <b>IA de Extracción Activada:</b> Se procesarán las{" "}
                          <b>{sheetNames.length} hojas</b> del archivo.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {!isBulkMode && (
                  <div className="p-4 px-6 bg-slate-50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-800 overflow-x-auto custom-scrollbar shrink-0 flex gap-3 items-center">
                    <span className="text-xs font-black uppercase text-slate-400 mr-2 shrink-0">
                      <Layers size={14} className="inline mr-1 mb-0.5" />{" "}
                      Pestaña Activa:
                    </span>
                    {sheetNames.map((name) => (
                      <button
                        key={name}
                        onClick={() => loadSheetData(workbook!, name)}
                        className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wider whitespace-nowrap transition-all border ${activeSheet === name ? "bg-brand text-white border-brand shadow-md shadow-brand/20" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-brand/50"}`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}

                <div className="p-4 px-6 bg-slate-100 dark:bg-[#080d1a] flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
                  <div className="flex items-center space-x-4">
                    <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Fila de Inicio Detectada:
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={startRow}
                      onChange={(e) => setStartRow(Number(e.target.value))}
                      className="w-20 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-brand font-black text-center py-1.5 rounded-xl outline-none focus:ring-2 focus:ring-brand/50 shadow-sm"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar p-6 bg-white dark:bg-[#03050a]">
                  <div className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm inline-block min-w-full">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-900">
                          <th className="p-3 border-r border-slate-200 dark:border-slate-800 w-12 text-center text-xs font-black text-slate-400">
                            #
                          </th>
                          {colIndices.map((colIdx) => {
                            const isMapped =
                              Object.values(columnMap).includes(colIdx);
                            return (
                              <th
                                key={colIdx}
                                className={`p-2 border-r border-slate-200 dark:border-slate-800 min-w-[220px] ${isMapped ? "bg-emerald-50 dark:bg-emerald-900/20" : ""}`}
                              >
                                <div className="relative">
                                  <select
                                    value={
                                      Object.keys(columnMap).find(
                                        (k) => columnMap[k] === colIdx,
                                      ) || ""
                                    }
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setColumnMap((prev) => {
                                        const newMap = { ...prev };
                                        if (val)
                                          Object.keys(newMap).forEach((k) => {
                                            if (newMap[k] === colIdx)
                                              newMap[k] = -1;
                                          });
                                        if (val) newMap[val] = colIdx;
                                        else {
                                          const keyToRemove = Object.keys(
                                            newMap,
                                          ).find((k) => newMap[k] === colIdx);
                                          if (keyToRemove)
                                            newMap[keyToRemove] = -1;
                                        }
                                        return newMap;
                                      });
                                    }}
                                    className={`w-full appearance-none bg-white dark:bg-slate-950 border-2 ${isMapped ? "border-emerald-400 dark:border-emerald-600 text-emerald-700 dark:text-emerald-400" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"} rounded-xl px-4 py-2.5 text-xs font-black outline-none cursor-pointer focus:ring-2 focus:ring-brand/50 transition-colors`}
                                  >
                                    <option value="">
                                      - Ignorar Columna -
                                    </option>
                                    <option value="name">
                                      📦 Descripción / Nombre *
                                    </option>
                                    <option value="costPrice">
                                      💲 Precio Lista *
                                    </option>
                                    <option value="sku">#️⃣ Código / SKU</option>
                                    <option value="cashPrice">
                                      💵 Desc. Efectivo
                                    </option>
                                    <option value="installments2">
                                      💳 2 Cuotas
                                    </option>
                                    <option value="installments3">
                                      💳 3 Cuotas
                                    </option>
                                    <option value="installments6">
                                      💳 6 Cuotas
                                    </option>
                                    <option value="installments12">
                                      💳 Ahora 12
                                    </option>
                                    <option value="stock">📊 Stock</option>
                                  </select>
                                  <ChevronDown
                                    size={14}
                                    className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${isMapped ? "text-emerald-500" : "text-slate-400"}`}
                                  />
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 bg-white dark:bg-[#0a0f1c] font-medium text-sm text-slate-600 dark:text-slate-400">
                        {gridData.slice(0, startRow + 15).map((row, rowIdx) => {
                          const rowArr = row as unknown[];
                          return (
                            <tr
                              key={rowIdx}
                              className={
                                rowIdx < startRow
                                  ? "bg-slate-50 dark:bg-slate-900/30 opacity-50 line-through"
                                  : "hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                              }
                            >
                              <td className="p-4 border-r border-slate-100 dark:border-slate-800 text-center text-xs font-black text-slate-400">
                                {rowIdx}
                              </td>
                              {colIndices.map((colIdx) => (
                                <td
                                  key={colIdx}
                                  className="p-4 border-r border-slate-100 dark:border-slate-800 truncate max-w-[300px] text-[13px] font-bold text-slate-700 dark:text-slate-300"
                                  title={String(rowArr[colIdx] || "")}
                                >
                                  {String(rowArr[colIdx] || "—")}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* STAGING AREA (PREVIEW INTERACTIVO) */}
            {step === 3 && (
              <div className="flex flex-col h-full animate-fade-in p-8 bg-slate-50 dark:bg-[#03050a] overflow-y-auto">
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-black text-slate-800 dark:text-white flex items-center justify-center gap-3">
                    <BarChart3 className="text-brand" size={32} /> Staging Area
                  </h3>
                  <p className="text-slate-500 font-medium mt-2 flex items-center justify-center gap-2">
                    <FileSpreadsheet size={16} className="text-slate-400" />
                    Archivo en análisis:{" "}
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {fileName}
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-4xl mx-auto w-full">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center gap-4 shadow-sm">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={32} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                        Artículos Válidos
                      </p>
                      <h4 className="text-4xl font-black text-slate-800 dark:text-white">
                        {totalExtractedProducts}
                      </h4>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center gap-4 shadow-sm">
                    <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center shrink-0">
                      <Layers size={32} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                        Marcas Detectadas
                      </p>
                      <h4 className="text-4xl font-black text-slate-800 dark:text-white">
                        {totalBrands}
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="max-w-4xl mx-auto w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={18} className="text-amber-500" />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Desglose por Proveedor / Marca
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium hidden md:inline">
                      Click en una marca para inspeccionar/reasignar
                    </span>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
                    {Object.keys(extractedData).map((brand) => (
                      <div
                        key={brand}
                        onClick={() => setInspectingBrand(brand)}
                        className="flex justify-between items-center p-4 hover:bg-brand/5 dark:hover:bg-slate-800/50 cursor-pointer rounded-xl transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0 group"
                      >
                        <span
                          className={`font-bold transition-colors flex items-center gap-2 ${brand === "Varios" ? "text-amber-600 dark:text-amber-500" : "text-slate-700 dark:text-white group-hover:text-brand"}`}
                        >
                          {brand}{" "}
                          {brand === "Varios" && <AlertTriangle size={14} />}
                        </span>
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-brand/10 group-hover:text-brand px-4 py-1.5 rounded-lg text-sm font-black transition-colors">
                          {extractedData[brand].length} prods.
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: CARGA A BASE DE DATOS */}
            {step === 4 && (
              <div className="flex flex-col items-center justify-center py-20 px-8 space-y-8 animate-fade-in w-full max-w-md mx-auto h-full">
                <div className="relative">
                  <div className="w-28 h-28 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
                  <div className="w-28 h-28 border-4 border-amber-500 rounded-full border-t-transparent animate-spin absolute inset-0"></div>
                  <Database
                    className="absolute inset-0 m-auto text-amber-500"
                    size={36}
                  />
                </div>
                <div className="text-center w-full">
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                    Inyectando Base de Datos
                  </h3>
                  {isBulkMode && bulkProgress.total > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 mt-8 border border-slate-200 dark:border-slate-800 shadow-xl">
                      <div className="flex justify-between text-xs font-black uppercase text-slate-500 tracking-widest mb-4">
                        <span>Progreso Global</span>
                        <span className="text-amber-600 dark:text-amber-400">
                          {bulkProgress.current} de {bulkProgress.total}
                        </span>
                      </div>
                      <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-6 shadow-inner">
                        <motion.div
                          className="h-full bg-amber-500"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(bulkProgress.current / bulkProgress.total) * 100}%`,
                          }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <div className="flex items-center justify-center gap-3 text-sm font-bold text-slate-700 dark:text-white bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <Loader2
                          size={18}
                          className="animate-spin text-amber-500"
                        />
                        <span>Procesando Marca:</span>
                        <span className="text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                          {bulkProgress.brand}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 🧠 MODAL INTERNO: INSPECCIÓN Y REASIGNACIÓN INDIVIDUAL */}
            <AnimatePresence>
              {inspectingBrand && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-0 z-10 bg-slate-50 dark:bg-[#03050a] flex flex-col p-6"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        Editando:{" "}
                        <span className="text-brand">{inspectingBrand}</span>
                      </h3>
                      <p className="text-sm font-medium text-slate-500 mt-1">
                        {extractedData[inspectingBrand]?.length} artículos
                        encontrados
                      </p>
                    </div>
                    <button
                      onClick={() => setInspectingBrand(null)}
                      className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-brand/10 hover:text-brand rounded-xl transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  {/* PANEL DE REASIGNACIÓN MASIVA */}
                  <div className="bg-white dark:bg-slate-900 border border-brand/20 rounded-2xl p-5 mb-6 flex flex-col md:flex-row gap-4 items-end shadow-sm">
                    <div className="flex-1 w-full">
                      <label className="flex items-center text-xs font-black uppercase text-slate-500 mb-2">
                        <ArrowRightLeft size={14} className="mr-1" /> Reasignar
                        todo el bloque a:
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          list="reassign-options"
                          value={reassignToBrand}
                          onChange={(e) => setReassignToBrand(e.target.value)}
                          placeholder="Buscar proveedor destino..."
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-brand outline-none"
                        />
                        <datalist id="reassign-options">
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.companyName} />
                          ))}
                        </datalist>
                        <ChevronDown
                          size={18}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleBulkReassign}
                      disabled={!reassignToBrand}
                      className="w-full md:w-auto px-8 py-3 bg-brand text-white font-black text-sm uppercase rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-600 transition-colors shadow-lg shadow-brand/20"
                    >
                      Mover Bloque
                    </button>
                  </div>

                  {/* LISTA PREVIA CON REASIGNACIÓN INDIVIDUAL */}
                  <div className="flex-1 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col">
                    <div className="overflow-auto custom-scrollbar p-4">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-black text-slate-400 uppercase tracking-wider">
                            <th className="p-3 w-1/2">Descripción</th>
                            <th className="p-3 text-right">Precio</th>
                            <th className="p-3 text-right w-1/3">
                              Asignar a...
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                          {extractedData[inspectingBrand]
                            ?.slice(0, 100)
                            .map((prod) => (
                              <tr
                                key={prod._tempId}
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/30"
                              >
                                <td
                                  className="p-3 text-sm font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]"
                                  title={prod.name}
                                >
                                  {prod.name}
                                </td>
                                <td className="p-3 text-sm font-black text-emerald-600 dark:text-emerald-400 text-right">
                                  ${prod.costPrice.toLocaleString()}
                                </td>
                                <td className="p-3 text-right">
                                  <select
                                    className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand w-full max-w-[200px]"
                                    value=""
                                    onChange={(e) =>
                                      handleSingleReassign(
                                        prod,
                                        inspectingBrand,
                                        e.target.value,
                                      )
                                    }
                                  >
                                    <option value="" disabled>
                                      Mover a...
                                    </option>
                                    {suppliers.map((s) => (
                                      <option key={s.id} value={s.companyName}>
                                        {s.companyName}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {extractedData[inspectingBrand]?.length > 100 && (
                        <div className="text-center p-4 text-xs font-bold text-slate-400">
                          Mostrando los primeros 100 artículos...
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {step === 2 && (
            <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0a0f1c] flex justify-between shrink-0 items-center">
              <button
                onClick={() => setStep(1)}
                className="px-8 py-3.5 font-black text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-colors"
              >
                Volver Atrás
              </button>
              <button
                onClick={handleAnalyzeData}
                className="flex items-center space-x-2 px-10 py-3.5 bg-brand text-white font-black text-sm uppercase rounded-2xl shadow-lg shadow-brand/30 hover:scale-105 transition-transform"
              >
                <BarChart3 size={18} />
                <span>Analizar Datos</span>
              </button>
            </div>
          )}

          {step === 3 && !inspectingBrand && (
            <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0a0f1c] flex justify-between shrink-0 items-center">
              <button
                onClick={() => setStep(2)}
                className="px-8 py-3.5 font-black text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-colors"
              >
                Volver a Mapear
              </button>
              <button
                onClick={handleFinalImport}
                className="flex items-center space-x-2 px-10 py-3.5 bg-brand text-white font-black text-sm uppercase rounded-2xl shadow-lg shadow-brand/30 hover:scale-105 transition-transform"
              >
                <Database size={18} />
                <span>Confirmar e Inyectar en DB</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
