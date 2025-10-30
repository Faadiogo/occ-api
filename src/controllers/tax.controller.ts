import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { TaxCalculationController } from './tax/TaxCalculationController';

export class TaxController {
  // ============================================
  // DELEGAÇÃO PARA CONTROLLERS ESPECÍFICOS
  // ============================================

  // Tax Calculations
  static async calculate(req: AuthRequest, res: Response, next: NextFunction) {
    return TaxCalculationController.calculate(req, res, next);
  }

  static async listReports(req: AuthRequest, res: Response, next: NextFunction) {
    return TaxCalculationController.listReports(req, res, next);
  }

  static async getReport(req: AuthRequest, res: Response, next: NextFunction) {
    return TaxCalculationController.getReport(req, res, next);
  }

  // ============================================
  // MÉTODOS ADICIONAIS PARA COMPATIBILIDADE
  // ============================================

  // Relatórios
  static async getReportsByCompany(req: AuthRequest, res: Response, next: NextFunction) {
    return TaxCalculationController.listReports(req, res, next);
  }

  static async getReportDetail(req: AuthRequest, res: Response, next: NextFunction) {
    return TaxCalculationController.getReport(req, res, next);
  }

  static async deleteReport(req: AuthRequest, res: Response, next: NextFunction) {
    return TaxCalculationController.deleteReport(req, res, next);
  }
}