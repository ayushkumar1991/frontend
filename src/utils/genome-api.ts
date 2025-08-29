/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/consistent-indexed-object-style */
import { env } from "~/env";

// Type definitions for API responses
interface GenomeDataResponse {
  ucscGenomes: Record<string, GenomeInfo>;
}

interface GenomeInfo {
  organism?: string;
  description?: string;
  sourceName?: string;
  active?: boolean;
}

interface ChromosomeDataResponse {
  chromosomes: Record<string, number>;
}

interface NCBISearchResponse {
  [0]: number; // count
  [1]: unknown;
  [2]: { GeneID?: string[] };
  [3]: unknown[];
}

interface NCBIGeneDetailsResponse {
  result: {
    [geneId: string]: {
      genomicinfo?: {
        chrstart: number;
        chrstop: number;
        strand?: string;
      }[];
      summary?: string;
      organism?: {
        scientificname: string;
        commonname: string;
      };
    };
  };
}

interface UCCSSequenceResponse {
  dna?: string;
  error?: string;
}

interface ClinVarSearchResponse {
  esearchresult?: {
    idlist?: string[];
  };
}

// Defines the structure for a single variant's details in the ClinVar summary
interface ClinVarVariantSummary {
  title?: string;
  obj_type?: string;
  germline_classification?: {
    description?: string;
  };
  gene_sort?: string;
  location_sort?: string;
}

// Corrected ClinVarSummaryResponse to handle the mixed-type 'result' object
interface ClinVarSummaryResponse {
  result?: {
    uids?: string[];
    [id: string]: ClinVarVariantSummary | string[] | undefined;
  };
}

export interface GenomeAssemblyFromSearch {
  id: string;
  name: string;
  sourceName: string;
  active: boolean;
}

export interface ChromosomeFromSearch {
  name: string;
  size: number;
}

export interface GeneFromSearch {
  symbol: string;
  name: string;
  chrom: string;
  description: string;
  gene_id?: string;
}

export interface GeneDetailsFromSearch {
  genomicinfo?: {
    chrstart: number;
    chrstop: number;
    strand?: string;
  }[];
  summary?: string;
  organism?: {
    scientificname: string;
    commonname: string;
  };
}

export interface GeneBounds {
  min: number;
  max: number;
}

export interface ClinvarVariant {
  clinvar_id: string;
  title: string;
  variation_type: string;
  classification: string;
  gene_sort: string;
  chromosome: string;
  location: string;
  evo2Result?: {
    prediction: string;
    delta_score: number;
    classification_confidence: number;
  };
  isAnalyzing?: boolean;
  evo2Error?: string;
}

export interface AnalysisResult {
  position: number;
  reference: string;
  alternative: string;
  delta_score: number;
  prediction: string;
  classification_confidence: number;
}

export async function getAvailableGenomes(): Promise<{
  genomes: Record<string, GenomeAssemblyFromSearch[]>;
}> {
  const apiUrl = "https://api.genome.ucsc.edu/list/ucscGenomes";
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error("Failed to fetch genome list from UCSC API");
  }

  const genomeData = (await response.json()) as GenomeDataResponse;
  if (!genomeData.ucscGenomes) {
    throw new Error("UCSC API error: missing ucscGenomes");
  }

  const genomes = genomeData.ucscGenomes;
  const structuredGenomes: Record<string, GenomeAssemblyFromSearch[]> = {};

  for (const genomeId in genomes) {
    const genomeInfo = genomes[genomeId];
    if (!genomeInfo) continue;
    
    const organism = genomeInfo.organism ?? "Other";

    structuredGenomes[organism] ??= [];
    structuredGenomes[organism]!.push({
      id: genomeId,
      name: genomeInfo.description ?? genomeId,
      sourceName: genomeInfo.sourceName ?? genomeId,
      active: !!genomeInfo.active,
    });
  }

  return { genomes: structuredGenomes };
}

export async function getGenomeChromosomes(
  genomeId: string,
): Promise<{ chromosomes: ChromosomeFromSearch[] }> {
  const apiUrl = `https://api.genome.ucsc.edu/list/chromosomes?genome=${genomeId}`;
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error("Failed to fetch chromosome list from UCSC API");
  }

  const chromosomeData = (await response.json()) as ChromosomeDataResponse;
  if (!chromosomeData.chromosomes) {
    throw new Error("UCSC API error: missing chromosomes");
  }

  const chromosomes: ChromosomeFromSearch[] = [];
  for (const chromId in chromosomeData.chromosomes) {
    if (
      chromId.includes("_") ||
      chromId.includes("Un") ||
      chromId.includes("random")
    )
      continue;
    
    const size = chromosomeData.chromosomes[chromId];
    if (typeof size === 'number') {
      chromosomes.push({
        name: chromId,
        size,
      });
    }
  }

  chromosomes.sort((a, b) => {
    const anum = a.name.replace("chr", "");
    const bnum = b.name.replace("chr", "");
    const isNumA = /^\d+$/.test(anum);
    const isNumB = /^\d+$/.test(bnum);
    if (isNumA && isNumB) return Number(anum) - Number(bnum);
    if (isNumA) return -1;
    if (isNumB) return 1;
    return anum.localeCompare(bnum);
  });

  return { chromosomes };
}

export async function searchGenes(
  query: string,
  genome: string,
): Promise<{ query: string; genome: string; results: GeneFromSearch[] }> {
  const url = "https://clinicaltables.nlm.nih.gov/api/ncbi_genes/v3/search";
  const params = new URLSearchParams({
    terms: query,
    df: "chromosome,Symbol,description,map_location,type_of_gene",
    ef: "chromosome,Symbol,description,map_location,type_of_gene,GenomicInfo,GeneID",
  });
  const response = await fetch(`${url}?${params.toString()}`);
  if (!response.ok) {
    throw new Error("NCBI API Error");
  }

  const data = (await response.json()) as NCBISearchResponse;
  const results: GeneFromSearch[] = [];

  const count = data[0];
  if (count > 0 && Array.isArray(data[3])) {
    const fieldMap = data[2];
    const geneIds = fieldMap.GeneID ?? [];
    const maxResults = Math.min(10, count);
    
    for (let i = 0; i < maxResults; ++i) {
      if (i < data[3].length) {
        try {
          const display = data[3][i] as unknown[];
          if (!Array.isArray(display) || display.length < 4) continue;
          
          let chrom = display[0] as string;
          if (chrom && typeof chrom === 'string' && !chrom.startsWith("chr")) {
            chrom = `chr${chrom}`;
          }
          
          const symbol = display[2] as string;
          const name = display[3] as string;
          const geneId = geneIds[i] ?? "";
          
          if (typeof symbol === 'string' && typeof name === 'string') {
            results.push({
              symbol,
              name,
              chrom: typeof chrom === 'string' ? chrom : '',
              description: name,
              gene_id: typeof geneId === 'string' ? geneId : "",
            });
          }
        } catch {
          continue;
        }
      }
    }
  }

  return { query, genome, results };
}

export async function fetchGeneDetails(
  geneId: string,
): Promise<{
  geneDetails: GeneDetailsFromSearch | null;
  geneBounds: GeneBounds | null;
  initialRange: { start: number; end: number } | null;
}> {
  try {
    const detailUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=gene&id=${geneId}&retmode=json`;
    const detailsResponse = await fetch(detailUrl);

    if (!detailsResponse.ok) {
      console.error(`Failed to fetch gene details: ${detailsResponse.statusText}`);
      return { geneDetails: null, geneBounds: null, initialRange: null };
    }

    // Corrected bug: used detailsResponse instead of undefined 'response'
    const detailData = (await detailsResponse.json()) as NCBIGeneDetailsResponse;

    const detail = detailData.result?.[geneId];
    if (detail?.genomicinfo?.[0]) {
      const info = detail.genomicinfo[0];
      if (typeof info.chrstart === 'number' && typeof info.chrstop === 'number') {
        const minPos = Math.min(info.chrstart, info.chrstop);
        const maxPos = Math.max(info.chrstart, info.chrstop);
        const bounds = { min: minPos, max: maxPos };

        const geneSize = maxPos - minPos;
        const seqStart = minPos;
        const seqEnd = geneSize > 10000 ? minPos + 10000 : maxPos;
        const range = { start: seqStart, end: seqEnd };

        return { geneDetails: detail, geneBounds: bounds, initialRange: range };
      }
    }

    return { geneDetails: null, geneBounds: null, initialRange: null };
  } catch {
    return { geneDetails: null, geneBounds: null, initialRange: null };
  }
}

export async function fetchGeneSequence(
  chrom: string,
  start: number,
  end: number,
  genomeId: string,
): Promise<{
  sequence: string;
  actualRange: { start: number; end: number };
  error?: string;
}> {
  try {
    const chromosome = chrom.startsWith("chr") ? chrom : `chr${chrom}`;
    const apiStart = start - 1;
    const apiEnd = end;

    const apiUrl = `https://api.genome.ucsc.edu/getData/sequence?genome=${genomeId};chrom=${chromosome};start=${apiStart};end=${apiEnd}`;
    const response = await fetch(apiUrl);
    const data = (await response.json()) as UCCSSequenceResponse;

    const actualRange = { start, end };

    if (data.error || !data.dna) {
      return { sequence: "", actualRange, error: data.error };
    }

    const sequence = data.dna.toUpperCase();
    return { sequence, actualRange };
  } catch {
    return {
      sequence: "",
      actualRange: { start, end },
      error: "Internal error in fetch gene sequence",
    };
  }
}

export async function fetchClinvarVariants(
  chrom: string,
  geneBound: GeneBounds,
  genomeId: string,
): Promise<ClinvarVariant[]> {
  const chromFormatted = chrom.replace(/^chr/i, "");
  const minBound = Math.min(geneBound.min, geneBound.max);
  const maxBound = Math.max(geneBound.min, geneBound.max);

  const positionField = genomeId === "hg19" ? "chrpos37" : "chrpos38";
  const searchTerm = `${chromFormatted}[chromosome] AND ${minBound}:${maxBound}[${positionField}]`;

  const searchUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
  const searchParams = new URLSearchParams({
    db: "clinvar",
    term: searchTerm,
    retmode: "json",
    retmax: "20",
  });

  const searchResponse = await fetch(`${searchUrl}?${searchParams.toString()}`);

  if (!searchResponse.ok) {
    throw new Error("ClinVar search failed: " + searchResponse.statusText);
  }

  const searchData = (await searchResponse.json()) as ClinVarSearchResponse;

  const idlist = searchData.esearchresult?.idlist;
  if (!idlist?.length) {
    console.log("No ClinVar variants found");
    return [];
  }

  const summaryUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";
  const summaryParams = new URLSearchParams({
    db: "clinvar",
    id: idlist.join(","),
    retmode: "json",
  });

  const summaryResponse = await fetch(`${summaryUrl}?${summaryParams.toString()}`);

  if (!summaryResponse.ok) {
    throw new Error("Failed to fetch variant details: " + summaryResponse.statusText);
  }

  const summaryData = (await summaryResponse.json()) as ClinVarSummaryResponse;
  const variants: ClinvarVariant[] = [];

  const uids = summaryData.result?.uids;
  if (uids && summaryData.result) {
    for (const id of uids) {
      const variant = summaryData.result[id];
      // Added type guard to ensure 'variant' is a variant summary object and not the uids array
      if (variant && typeof variant === 'object' && !Array.isArray(variant)) {
        const objType = variant.obj_type ?? "Unknown";
        const variationType = typeof objType === 'string' 
          ? objType
              .split(" ")
              .map((word: string) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              )
              .join(" ")
          : "Unknown";

        variants.push({
          clinvar_id: id,
          title: variant.title ?? "",
          variation_type: variationType,
          classification: variant.germline_classification?.description ?? "Unknown",
          gene_sort: variant.gene_sort ?? "",
          chromosome: chromFormatted,
          location: variant.location_sort
            ? Number(variant.location_sort).toLocaleString()
            : "Unknown",
        });
      }
    }
  }

  return variants;
}

export async function analyzeVariantWithAPI({
  position,
  alternative,
  genomeId,
  chromosome,
}: {
  position: number;
  alternative: string;
  genomeId: string;
  chromosome: string;
}): Promise<AnalysisResult> {
  const url = env.NEXT_PUBLIC_ANALYZE_SINGLE_VARIANT_BASE_URL;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      variant_position: position,
      alternative: alternative,
      genome: genomeId,
      chromosome: chromosome,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error("Failed to analyze variant: " + errorText);
  }

  return (await response.json()) as AnalysisResult;
}
