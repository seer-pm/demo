import { downloadCsv } from "@/lib/utils";
import type { CsvOutcome } from "@/utils/csvParser";
import { parseCSV } from "@/utils/csvParser";
import React, { useCallback } from "react";
import { useForm } from "react-hook-form";

interface CSVUploadProps {
  onDataParsed: (data: CsvOutcome[]) => void;
  onClose: () => void;
  existingOutcomes: { value: string; token: string }[];
}

interface FormData {
  csvFile: FileList;
}

const sampleOutcomes: CsvOutcome[] = [
  { value: "Democratic Party", token: "DEM" },
  { value: "Republican Party", token: "GOP" },
  { value: "Green Party", token: "GRN" },
];

export const CSVUpload: React.FC<CSVUploadProps> = ({ onDataParsed, onClose, existingOutcomes }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<FormData>();

  const onSubmit = useCallback(
    async (data: FormData) => {
      try {
        clearErrors();
        const file = data.csvFile[0];
        if (!file) {
          setError("csvFile", { message: "Please select a CSV file" });
          return;
        }

        const text = await file.text();
        const parsedData = parseCSV(text, existingOutcomes);
        onDataParsed(parsedData);
        onClose();
      } catch (error) {
        setError("csvFile", {
          message: error instanceof Error ? error.message : "Failed to parse CSV",
        });
      }
    },
    [onDataParsed, setError, clearErrors, onClose, existingOutcomes],
  );

  const downloadSampleCsv = () => {
    downloadCsv(
      [
        { key: "outcome", title: "outcome" },
        { key: "token", title: "token name" },
      ],
      sampleOutcomes.map((row) => ({
        outcome: row.value,
        token: row.token,
      })),
      "sample-outcomes",
    );
  };

  return (
    <div className="overflow-hidden">
      <div className="px-6 py-4">
        <h2 className="text-2xl font-bold text-base-content">Import Outcomes</h2>
      </div>

      <div className="p-6">
        <div className="mb-6 p-4 bg-base-200 rounded-lg">
          <h3 className="font-medium text-base-content mb-2">Required CSV Format</h3>
          <div className="bg-base-100 p-3 rounded border border-separator-100 font-mono text-sm text-base-content">
            <div className="opacity-50">outcome,token name</div>
            <div>Democratic Party,DEM</div>
            <div>Republican Party,GOP</div>
            <div className="opacity-50">...</div>
          </div>
          <p className="text-xs opacity-50 mt-2">
            Each row represents an outcome and its token name. Token names are optional but cannot exceed 11 characters.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-sm font-medium text-base-content" htmlFor="csvFile">
                Select CSV File
              </label>
              <button
                type="button"
                onClick={downloadSampleCsv}
                className="hover:underline cursor-pointer text-base-content/50 text-sm"
              >
                Download Sample CSV
              </button>
            </div>
            <input
              id="csvFile"
              {...register("csvFile", { required: "CSV file is required" })}
              type="file"
              accept=".csv"
              className="w-full p-3 border-2 border-dashed border-separator-100 rounded-md hover:border-purple-primary focus:border-purple-primary focus:ring-2 focus:ring-purple-primary focus:ring-opacity-20 transition-colors text-base-content file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-purple-primary file:text-white file:text-sm file:cursor-pointer"
            />
            <div className="min-h-[20px]">
              {errors.csvFile && <p className="text-error text-sm">{errors.csvFile.message}</p>}
            </div>
          </div>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer flex-1 bg-base-300 text-base-content py-4 px-6 rounded-md hover:bg-base-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cursor-pointer flex-1 bg-purple-primary text-white py-4 px-6 rounded-md hover:opacity-80 transition-all font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import Outcomes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
