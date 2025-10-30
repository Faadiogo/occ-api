import { getCNAEInfo, getFaixasByAnexo } from '../constants/tax-tables';

// Interface para resultado de busca CNAE
export interface CNAESearchResult {
  CNAE: number;
  Descrição: string;
  Anexo: string;
  'Fator R': string;
  Alíquota: number;
  Tipo: string;
}

// Interface para resultado paginado
export interface CNAEPaginatedResult {
  data: CNAESearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Cache simples em memória
class CNAECache {
  private cache = new Map<string, { data: CNAESearchResult[]; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutos

  set(key: string, data: CNAESearchResult[]): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(key: string): CNAESearchResult[] | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Verificar se expirou
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

const cnaeCache = new CNAECache();

export class CNAEService {
  /**
   * Busca CNAEs com cache e paginação
   */
  static search(
    searchTerm: string = '', 
    page: number = 1, 
    limit: number = 20
  ): CNAEPaginatedResult {
    const cacheKey = `${searchTerm}-${page}-${limit}`;
    
    // Tentar buscar do cache primeiro
    const cachedResult = cnaeCache.get(cacheKey);
    if (cachedResult) {
      return this.formatPaginatedResult(cachedResult, page, limit);
    }

    // Se não estiver no cache, buscar dados
    const allCNAEs = getCNAEInfo(searchTerm);
    
    // Aplicar paginação
    const offset = (page - 1) * limit;
    const paginatedData = allCNAEs.slice(offset, offset + limit);
    
    // Armazenar no cache
    cnaeCache.set(cacheKey, allCNAEs);

    return this.formatPaginatedResult(paginatedData, page, limit, allCNAEs.length);
  }

  /**
   * Busca CNAE por código específico
   */
  static findByCode(code: string): CNAESearchResult | null {
    const cacheKey = `code-${code}`;
    const cached = cnaeCache.get(cacheKey);
    
    if (cached && cached.length > 0) {
      return cached[0];
    }

    const results = getCNAEInfo(code);
    if (results.length > 0) {
      cnaeCache.set(cacheKey, results);
      return results[0];
    }

    return null;
  }

  /**
   * Busca faixas por anexo
   */
  static getFaixasByAnexo(anexo: string): Array<{
    Anexo: string;
    Faixa: string;
    'Receita de': number;
    'Receita até': number;
    Alíquota: number;
    'Valor a Deduzir': number;
  }> {
    return getFaixasByAnexo(anexo);
  }

  /**
   * Formata resultado paginado
   */
  private static formatPaginatedResult(
    data: CNAESearchResult[], 
    page: number, 
    limit: number, 
    total?: number
  ): CNAEPaginatedResult {
    const totalCount = total || data.length;
    
    return {
      data,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  /**
   * Limpa cache (útil para testes ou quando dados mudam)
   */
  static clearCache(): void {
    cnaeCache.clear();
  }

  /**
   * Estatísticas do cache
   */
  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: cnaeCache['cache'].size,
      keys: Array.from(cnaeCache['cache'].keys())
    };
  }
}
