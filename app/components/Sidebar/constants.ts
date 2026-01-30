/**
 * Constants cho Sidebar Component
 */

import {
  FolderSearch,
  ClipboardCheck,
  FileText,
  Users,
} from 'lucide-react';
import { PhaseId } from '@/app/models/types';
import { Phase } from './types';

// API Configuration
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://127.0.0.1:3001";
export const API_URL = `${baseUrl}/tools_management/get_tools`;

// Timeout cho agent processing
export const TIME_OUT = 3000000;

// Phase configurations
export const phases: Phase[] = [
  {
    id: 'discovery' as PhaseId,
    name: 'Discovery & Requirements',
    shortName: 'Discovery',
    icon: FolderSearch,
    badge: null,
  },
  {
    id: 'analysis' as PhaseId,
    name: 'Analysis & Validation',
    shortName: 'Analysis',
    icon: ClipboardCheck,
    badge: null,
  },
  {
    id: 'documentation' as PhaseId,
    name: 'Documentation',
    shortName: 'Docs',
    icon: FileText,
    badge: null,
  },
  {
    id: 'communication' as PhaseId,
    name: 'Communication & Handoff',
    shortName: 'Handoff',
    icon: Users,
    badge: null,
  }
];
