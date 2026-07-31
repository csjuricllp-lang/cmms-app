import { useState } from 'react';
import { Search, Info, Copy, FileText, Activity, CheckSquare, List, Hash, Type } from 'lucide-react';
import { api } from '../../../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { cn } from '../../../lib/utils';

// Helper to get task icon based on type
const getTaskIcon = (type: string) => {
    switch (type) {
        case 'CHECKBOX': return <CheckSquare className="w-4 h-4" />;
        case 'PASS_FAIL': return <Activity className="w-4 h-4" />;
        case 'TEXT_INPUT': return <Type className="w-4 h-4" />;
        case 'NUMBER': return <Hash className="w-4 h-4" />;
        case 'SELECT': return <List className="w-4 h-4" />;
        default: return <FileText className="w-4 h-4" />;
    }
};

const INDUSTRIES = [
    'All',
    'Agriculture',
    'Facility Maintenance',
    'Fleet Management',
    'Food Service',
    'Healthcare',
    'Manufacturing',
    'Property Management',
    'Utilities, Oil, and Gas',
    'Safety'
];

const USE_CASES = [
    'All',
    'Audit',
    'Inspection',
    'Maintenance',
    'Sanitation'
];

const TEMPLATES = [
    {
        id: 'tmpl_extracted_1',
        title: 'Roof of Building Inspection - Bi-Annual',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Roof of Building Inspection - Bi-Annual',
        tasks: [
          {
                    task: "Task 1 for Roof of Building Inspection - Bi-Annual",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Roof of Building Inspection - Bi-Annual",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Roof of Building Inspection - Bi-Annual",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Roof of Building Inspection - Bi-Annual",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Roof of Building Inspection - Bi-Annual",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Roof of Building Inspection - Bi-Annual",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_2',
        title: 'Roofing Elements of Building Inspection - Bi-Annual',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Roofing Elements of Building Inspection - Bi-Annual',
        tasks: [
          {
                    task: "Task 1 for Roofing Elements of Building Inspection - Bi-Annual",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Roofing Elements of Building Inspection - Bi-Annual",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Roofing Elements of Building Inspection - Bi-Annual",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Roofing Elements of Building Inspection - Bi-Annual",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Roofing Elements of Building Inspection - Bi-Annual",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Roofing Elements of Building Inspection - Bi-Annual",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_3',
        title: 'Mechanical Systems of Building Inspection',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Mechanical Systems of Building Inspection',
        tasks: [
          {
                    task: "Task 1 for Mechanical Systems of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Mechanical Systems of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Mechanical Systems of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Mechanical Systems of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_4',
        title: 'Interior of Building Inspection',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Interior of Building Inspection',
        tasks: [
          {
                    task: "Task 1 for Interior of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Interior of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Interior of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Interior of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Interior of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Interior of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Interior of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Interior of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Interior of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 10 for Interior of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 11 for Interior of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 12 for Interior of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 13 for Interior of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 14 for Interior of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 15 for Interior of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 16 for Interior of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 17 for Interior of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 18 for Interior of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_5',
        title: 'Ground of Building Inspection',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Ground of Building Inspection',
        tasks: [
          {
                    task: "Task 1 for Ground of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Ground of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Ground of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Ground of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Ground of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Ground of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_6',
        title: 'Exterior Wall Material of Building Inspection - Bi-Annual',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Exterior Wall Material of Building Inspection - Bi-Annual',
        tasks: [
          {
                    task: "Task 1 for Exterior Wall Material of Building Inspection - Bi-Annual",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Exterior Wall Material of Building Inspection - Bi-Annual",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Exterior Wall Material of Building Inspection - Bi-Annual",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_7',
        title: 'Exterior Finishes of Building Inspection',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Exterior Finishes of Building Inspection',
        tasks: [
          {
                    task: "Task 1 for Exterior Finishes of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Exterior Finishes of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_8',
        title: 'Exterior Ceilings and Decks of Building Inspection - Bi-Annual',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Exterior Ceilings and Decks of Building Inspection - Bi-Annual',
        tasks: [
          {
                    task: "Task 1 for Exterior Ceilings and Decks of Building Inspection - Bi-Annual",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Exterior Ceilings and Decks of Building Inspection - Bi-Annual",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Exterior Ceilings and Decks of Building Inspection - Bi-Annual",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_9',
        title: 'Electrical Systems of Building Inspection',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Electrical Systems of Building Inspection',
        tasks: [
          {
                    task: "Task 1 for Electrical Systems of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Electrical Systems of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Electrical Systems of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Electrical Systems of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Electrical Systems of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Electrical Systems of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_10',
        title: 'Building and Facilities Inspection for Cosmetics Manufacturing',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Building and Facilities Inspection for Cosmetics Manufacturing',
        tasks: [
          {
                    task: "Task 1 for Building and Facilities Inspection for Cosmetics Manufacturing",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Building and Facilities Inspection for Cosmetics Manufacturing",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Building and Facilities Inspection for Cosmetics Manufacturing",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Building and Facilities Inspection for Cosmetics Manufacturing",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Building and Facilities Inspection for Cosmetics Manufacturing",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_11',
        title: 'Attic of Building Inspection',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Attic of Building Inspection',
        tasks: [
          {
                    task: "Task 1 for Attic of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Attic of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Attic of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Attic of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Attic of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Attic of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Attic of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Attic of Building Inspection",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_12',
        title: 'Air Handling System Inspection - Annually',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Air Handling System Inspection - Annually',
        tasks: [
          {
                    task: "Task 1 for Air Handling System Inspection - Annually",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Air Handling System Inspection - Annually",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_13',
        title: 'Air Handling System Inspection - Monthly',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Air Handling System Inspection - Monthly',
        tasks: [
          {
                    task: "Task 1 for Air Handling System Inspection - Monthly",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Air Handling System Inspection - Monthly",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Air Handling System Inspection - Monthly",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_14',
        title: 'Reopening Facility Maintenance, Employment (Covid-19 Best Practices)',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Reopening Facility Maintenance, Employment (Covid-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Facility Maintenance, Employment (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Facility Maintenance, Employment (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Facility Maintenance, Employment (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Facility Maintenance, Employment (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Facility Maintenance, Employment (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening Facility Maintenance, Employment (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening Facility Maintenance, Employment (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Reopening Facility Maintenance, Employment (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Reopening Facility Maintenance, Employment (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 10 for Reopening Facility Maintenance, Employment (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 11 for Reopening Facility Maintenance, Employment (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 12 for Reopening Facility Maintenance, Employment (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 13 for Reopening Facility Maintenance, Employment (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 14 for Reopening Facility Maintenance, Employment (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_15',
        title: 'Reopening Facility Maintenance, Health Policy (Covid-19 Best Practices)',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Reopening Facility Maintenance, Health Policy (Covid-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Facility Maintenance, Health Policy (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Facility Maintenance, Health Policy (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Facility Maintenance, Health Policy (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Facility Maintenance, Health Policy (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Facility Maintenance, Health Policy (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening Facility Maintenance, Health Policy (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening Facility Maintenance, Health Policy (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Reopening Facility Maintenance, Health Policy (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Reopening Facility Maintenance, Health Policy (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 10 for Reopening Facility Maintenance, Health Policy (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 11 for Reopening Facility Maintenance, Health Policy (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 12 for Reopening Facility Maintenance, Health Policy (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 13 for Reopening Facility Maintenance, Health Policy (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 14 for Reopening Facility Maintenance, Health Policy (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 15 for Reopening Facility Maintenance, Health Policy (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 16 for Reopening Facility Maintenance, Health Policy (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 17 for Reopening Facility Maintenance, Health Policy (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 18 for Reopening Facility Maintenance, Health Policy (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 19 for Reopening Facility Maintenance, Health Policy (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 20 for Reopening Facility Maintenance, Health Policy (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_16',
        title: 'Reopening Facility Maintenance, Logistics (Covid-19 Best Practices)',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Reopening Facility Maintenance, Logistics (Covid-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Facility Maintenance, Logistics (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Facility Maintenance, Logistics (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Facility Maintenance, Logistics (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Facility Maintenance, Logistics (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Facility Maintenance, Logistics (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening Facility Maintenance, Logistics (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening Facility Maintenance, Logistics (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Reopening Facility Maintenance, Logistics (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Reopening Facility Maintenance, Logistics (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 10 for Reopening Facility Maintenance, Logistics (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_17',
        title: 'Reopening Facility Maintenance and Faith-Based Organizations (Covid-19 Best Practices)',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Reopening Facility Maintenance and Faith-Based Organizations (Covid-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Facility Maintenance and Faith-Based Organizations (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Facility Maintenance and Faith-Based Organizations (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Facility Maintenance and Faith-Based Organizations (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Facility Maintenance and Faith-Based Organizations (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Facility Maintenance and Faith-Based Organizations (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening Facility Maintenance and Faith-Based Organizations (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening Facility Maintenance and Faith-Based Organizations (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Reopening Facility Maintenance and Faith-Based Organizations (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Reopening Facility Maintenance and Faith-Based Organizations (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 10 for Reopening Facility Maintenance and Faith-Based Organizations (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 11 for Reopening Facility Maintenance and Faith-Based Organizations (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 12 for Reopening Facility Maintenance and Faith-Based Organizations (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 13 for Reopening Facility Maintenance and Faith-Based Organizations (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_18',
        title: 'Cleaning for Facility Maintenance, All Areas (Covid-19)',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Cleaning for Facility Maintenance, All Areas (Covid-19)',
        tasks: [
          {
                    task: "Task 1 for Cleaning for Facility Maintenance, All Areas (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Cleaning for Facility Maintenance, All Areas (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Cleaning for Facility Maintenance, All Areas (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_19',
        title: 'Cleaning for Facility Maintenance, Athletics Facilities (Covid-19)',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Cleaning for Facility Maintenance, Athletics Facilities (Covid-19)',
        tasks: [
          {
                    task: "Task 1 for Cleaning for Facility Maintenance, Athletics Facilities (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Cleaning for Facility Maintenance, Athletics Facilities (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Cleaning for Facility Maintenance, Athletics Facilities (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Cleaning for Facility Maintenance, Athletics Facilities (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_20',
        title: 'Cleaning for Facility Maintenance, Bathrooms (Covid-19)',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Cleaning for Facility Maintenance, Bathrooms (Covid-19)',
        tasks: [
          {
                    task: "Task 1 for Cleaning for Facility Maintenance, Bathrooms (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Cleaning for Facility Maintenance, Bathrooms (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Cleaning for Facility Maintenance, Bathrooms (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Cleaning for Facility Maintenance, Bathrooms (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Cleaning for Facility Maintenance, Bathrooms (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Cleaning for Facility Maintenance, Bathrooms (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Cleaning for Facility Maintenance, Bathrooms (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Cleaning for Facility Maintenance, Bathrooms (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Cleaning for Facility Maintenance, Bathrooms (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_21',
        title: 'Cleaning for Facility Maintenance, Cafeteria (Covid-19)',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Cleaning for Facility Maintenance, Cafeteria (Covid-19)',
        tasks: [
          {
                    task: "Task 1 for Cleaning for Facility Maintenance, Cafeteria (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Cleaning for Facility Maintenance, Cafeteria (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Cleaning for Facility Maintenance, Cafeteria (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Cleaning for Facility Maintenance, Cafeteria (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Cleaning for Facility Maintenance, Cafeteria (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Cleaning for Facility Maintenance, Cafeteria (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Cleaning for Facility Maintenance, Cafeteria (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Cleaning for Facility Maintenance, Cafeteria (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Cleaning for Facility Maintenance, Cafeteria (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 10 for Cleaning for Facility Maintenance, Cafeteria (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_22',
        title: 'Cleaning for Facility Maintenance, Classrooms & Offices (Covid-19)',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Cleaning for Facility Maintenance, Classrooms & Offices (Covid-19)',
        tasks: [
          {
                    task: "Task 1 for Cleaning for Facility Maintenance, Classrooms & Offices (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Cleaning for Facility Maintenance, Classrooms & Offices (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Cleaning for Facility Maintenance, Classrooms & Offices (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Cleaning for Facility Maintenance, Classrooms & Offices (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Cleaning for Facility Maintenance, Classrooms & Offices (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Cleaning for Facility Maintenance, Classrooms & Offices (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Cleaning for Facility Maintenance, Classrooms & Offices (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Cleaning for Facility Maintenance, Classrooms & Offices (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Cleaning for Facility Maintenance, Classrooms & Offices (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 10 for Cleaning for Facility Maintenance, Classrooms & Offices (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 11 for Cleaning for Facility Maintenance, Classrooms & Offices (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 12 for Cleaning for Facility Maintenance, Classrooms & Offices (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 13 for Cleaning for Facility Maintenance, Classrooms & Offices (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 14 for Cleaning for Facility Maintenance, Classrooms & Offices (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_23',
        title: 'Cleaning for Facility Maintenance, Gyms & Auditoriums (Covid-19)',
        industry: 'Property Management',
        description: 'Standard checklist for Cleaning for Facility Maintenance, Gyms & Auditoriums (Covid-19)',
        tasks: [
          {
                    task: "Task 1 for Cleaning for Facility Maintenance, Gyms & Auditoriums (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Cleaning for Facility Maintenance, Gyms & Auditoriums (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Cleaning for Facility Maintenance, Gyms & Auditoriums (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Cleaning for Facility Maintenance, Gyms & Auditoriums (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_24',
        title: 'Cleaning for Facility Maintenance, Hallways (Covid-19)',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Cleaning for Facility Maintenance, Hallways (Covid-19)',
        tasks: [
          {
                    task: "Task 1 for Cleaning for Facility Maintenance, Hallways (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Cleaning for Facility Maintenance, Hallways (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Cleaning for Facility Maintenance, Hallways (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Cleaning for Facility Maintenance, Hallways (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Cleaning for Facility Maintenance, Hallways (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_25',
        title: 'Cleaning for Facility Maintenance, Outdoor Areas (Covid-19)',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Cleaning for Facility Maintenance, Outdoor Areas (Covid-19)',
        tasks: [
          {
                    task: "Task 1 for Cleaning for Facility Maintenance, Outdoor Areas (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Cleaning for Facility Maintenance, Outdoor Areas (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Cleaning for Facility Maintenance, Outdoor Areas (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Cleaning for Facility Maintenance, Outdoor Areas (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Cleaning for Facility Maintenance, Outdoor Areas (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Cleaning for Facility Maintenance, Outdoor Areas (Covid-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_26',
        title: 'Reopening Child Care Facilities (Covid-19 Best Practices)',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Reopening Child Care Facilities (Covid-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Child Care Facilities (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Child Care Facilities (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Child Care Facilities (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Child Care Facilities (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Child Care Facilities (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening Child Care Facilities (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening Child Care Facilities (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Reopening Child Care Facilities (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Reopening Child Care Facilities (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 10 for Reopening Child Care Facilities (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 11 for Reopening Child Care Facilities (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 12 for Reopening Child Care Facilities (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 13 for Reopening Child Care Facilities (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_27',
        title: 'Reopening Child Care Facilities - Steps to Take When You Have a Suspected or Confirmed Case in Your Facility (Covid-19 Best Practices)',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Reopening Child Care Facilities - Steps to Take When You Have a Suspected or Confirmed Case in Your Facility (Covid-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Child Care Facilities - Steps to Take When You Have a Suspected or Confirmed Case in Your Facility (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Child Care Facilities - Steps to Take When You Have a Suspected or Confirmed Case in Your Facility (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Child Care Facilities - Steps to Take When You Have a Suspected or Confirmed Case in Your Facility (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Child Care Facilities - Steps to Take When You Have a Suspected or Confirmed Case in Your Facility (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Child Care Facilities - Steps to Take When You Have a Suspected or Confirmed Case in Your Facility (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening Child Care Facilities - Steps to Take When You Have a Suspected or Confirmed Case in Your Facility (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening Child Care Facilities - Steps to Take When You Have a Suspected or Confirmed Case in Your Facility (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Reopening Child Care Facilities - Steps to Take When You Have a Suspected or Confirmed Case in Your Facility (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_28',
        title: 'Reopening K-12 Facility Maintenance: Administrative Practices (Covid-19 Best Practices)',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Reopening K-12 Facility Maintenance: Administrative Practices (Covid-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening K-12 Facility Maintenance: Administrative Practices (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening K-12 Facility Maintenance: Administrative Practices (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening K-12 Facility Maintenance: Administrative Practices (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening K-12 Facility Maintenance: Administrative Practices (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening K-12 Facility Maintenance: Administrative Practices (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening K-12 Facility Maintenance: Administrative Practices (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening K-12 Facility Maintenance: Administrative Practices (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Reopening K-12 Facility Maintenance: Administrative Practices (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Reopening K-12 Facility Maintenance: Administrative Practices (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 10 for Reopening K-12 Facility Maintenance: Administrative Practices (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_29',
        title: 'Reopening K-12 Facility Maintenance: Cafeteria Guidelines (Covid-19 Best Practices)',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Reopening K-12 Facility Maintenance: Cafeteria Guidelines (Covid-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening K-12 Facility Maintenance: Cafeteria Guidelines (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening K-12 Facility Maintenance: Cafeteria Guidelines (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening K-12 Facility Maintenance: Cafeteria Guidelines (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening K-12 Facility Maintenance: Cafeteria Guidelines (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening K-12 Facility Maintenance: Cafeteria Guidelines (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_30',
        title: 'Reopening K-12 Facility Maintenance: Clean, Sanitize, & Ventilate (Covid-19 Best Practices)',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Reopening K-12 Facility Maintenance: Clean, Sanitize, & Ventilate (Covid-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening K-12 Facility Maintenance: Clean, Sanitize, & Ventilate (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening K-12 Facility Maintenance: Clean, Sanitize, & Ventilate (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening K-12 Facility Maintenance: Clean, Sanitize, & Ventilate (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening K-12 Facility Maintenance: Clean, Sanitize, & Ventilate (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening K-12 Facility Maintenance: Clean, Sanitize, & Ventilate (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening K-12 Facility Maintenance: Clean, Sanitize, & Ventilate (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_31',
        title: 'Reopening K-12 Facility Maintenance: Limit Sharing (Covid-19 Best Practices)',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Reopening K-12 Facility Maintenance: Limit Sharing (Covid-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening K-12 Facility Maintenance: Limit Sharing (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening K-12 Facility Maintenance: Limit Sharing (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening K-12 Facility Maintenance: Limit Sharing (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_32',
        title: 'Reopening K-12 Facility Maintenance: Maintain Health & Hygiene (Covid-19 Best Practices)',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Reopening K-12 Facility Maintenance: Maintain Health & Hygiene (Covid-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening K-12 Facility Maintenance: Maintain Health & Hygiene (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening K-12 Facility Maintenance: Maintain Health & Hygiene (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening K-12 Facility Maintenance: Maintain Health & Hygiene (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening K-12 Facility Maintenance: Maintain Health & Hygiene (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening K-12 Facility Maintenance: Maintain Health & Hygiene (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening K-12 Facility Maintenance: Maintain Health & Hygiene (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_33',
        title: 'Reopening K-12 Facility Maintenance: Manage Student & Staff Health (Covid-19 Best Practices)',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Reopening K-12 Facility Maintenance: Manage Student & Staff Health (Covid-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening K-12 Facility Maintenance: Manage Student & Staff Health (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening K-12 Facility Maintenance: Manage Student & Staff Health (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening K-12 Facility Maintenance: Manage Student & Staff Health (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening K-12 Facility Maintenance: Manage Student & Staff Health (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening K-12 Facility Maintenance: Manage Student & Staff Health (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening K-12 Facility Maintenance: Manage Student & Staff Health (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening K-12 Facility Maintenance: Manage Student & Staff Health (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_34',
        title: 'Reopening Colleges and Universities (Covid-19 Best Practices)',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Reopening Colleges and Universities (Covid-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Colleges and Universities (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Colleges and Universities (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Colleges and Universities (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Colleges and Universities (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Colleges and Universities (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening Colleges and Universities (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening Colleges and Universities (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Reopening Colleges and Universities (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Reopening Colleges and Universities (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 10 for Reopening Colleges and Universities (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 11 for Reopening Colleges and Universities (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_35',
        title: 'Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for K-12 Facility Maintenance',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for K-12 Facility Maintenance',
        tasks: [
          {
                    task: "Task 1 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for K-12 Facility Maintenance",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for K-12 Facility Maintenance",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for K-12 Facility Maintenance",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for K-12 Facility Maintenance",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for K-12 Facility Maintenance",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for K-12 Facility Maintenance",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for K-12 Facility Maintenance",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for K-12 Facility Maintenance",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_36',
        title: 'Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Fitness Centers and Gyms',
        industry: 'Property Management',
        description: 'Standard checklist for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Fitness Centers and Gyms',
        tasks: [
          {
                    task: "Task 1 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Fitness Centers and Gyms",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Fitness Centers and Gyms",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Fitness Centers and Gyms",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Fitness Centers and Gyms",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Fitness Centers and Gyms",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Fitness Centers and Gyms",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Fitness Centers and Gyms",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_37',
        title: 'Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Facility Maintenance',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Facility Maintenance',
        tasks: [
          {
                    task: "Task 1 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Facility Maintenance",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Facility Maintenance",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Facility Maintenance",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Facility Maintenance",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Facility Maintenance",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Facility Maintenance",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Facility Maintenance",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_38',
        title: 'Reopening Small Businesses: Step 1 - Educate Yourself (Covid-19 Best Practices)',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Reopening Small Businesses: Step 1 - Educate Yourself (Covid-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Small Businesses: Step 1 - Educate Yourself (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Small Businesses: Step 1 - Educate Yourself (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Small Businesses: Step 1 - Educate Yourself (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_39',
        title: 'Reopening Small Businesses: Step 2 - Assess Your Finances (Covid-19 Best Practices)',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Reopening Small Businesses: Step 2 - Assess Your Finances (Covid-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Small Businesses: Step 2 - Assess Your Finances (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Small Businesses: Step 2 - Assess Your Finances (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Small Businesses: Step 2 - Assess Your Finances (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Small Businesses: Step 2 - Assess Your Finances (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Small Businesses: Step 2 - Assess Your Finances (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening Small Businesses: Step 2 - Assess Your Finances (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_40',
        title: 'Reopening Small Businesses: Step 3 - Adjust Business Model (Covid-19 Best Practices)',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Reopening Small Businesses: Step 3 - Adjust Business Model (Covid-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Small Businesses: Step 3 - Adjust Business Model (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Small Businesses: Step 3 - Adjust Business Model (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Small Businesses: Step 3 - Adjust Business Model (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Small Businesses: Step 3 - Adjust Business Model (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_41',
        title: 'Reopening Small Businesses: Step 4 - Plan Your Staffing (Covid-19 Best Practices)',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Reopening Small Businesses: Step 4 - Plan Your Staffing (Covid-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Small Businesses: Step 4 - Plan Your Staffing (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Small Businesses: Step 4 - Plan Your Staffing (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Small Businesses: Step 4 - Plan Your Staffing (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Small Businesses: Step 4 - Plan Your Staffing (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Small Businesses: Step 4 - Plan Your Staffing (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening Small Businesses: Step 4 - Plan Your Staffing (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening Small Businesses: Step 4 - Plan Your Staffing (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_42',
        title: 'Reopening Small Businesses: Step 5 - Keep Your Workplace Clean (Covid-19 Best Practices)',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Reopening Small Businesses: Step 5 - Keep Your Workplace Clean (Covid-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Small Businesses: Step 5 - Keep Your Workplace Clean (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Small Businesses: Step 5 - Keep Your Workplace Clean (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Small Businesses: Step 5 - Keep Your Workplace Clean (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Small Businesses: Step 5 - Keep Your Workplace Clean (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Small Businesses: Step 5 - Keep Your Workplace Clean (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_43',
        title: 'Reopening Small Businesses: Step 6 - Implement Social Distancing (Covid-19 Best Practices)',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Reopening Small Businesses: Step 6 - Implement Social Distancing (Covid-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Small Businesses: Step 6 - Implement Social Distancing (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Small Businesses: Step 6 - Implement Social Distancing (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Small Businesses: Step 6 - Implement Social Distancing (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Small Businesses: Step 6 - Implement Social Distancing (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Small Businesses: Step 6 - Implement Social Distancing (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening Small Businesses: Step 6 - Implement Social Distancing (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening Small Businesses: Step 6 - Implement Social Distancing (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Reopening Small Businesses: Step 6 - Implement Social Distancing (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_44',
        title: 'Reopening Small Businesses: Step 7 - Set Up Health Screening (Covid-19 Best Practices)',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Reopening Small Businesses: Step 7 - Set Up Health Screening (Covid-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Small Businesses: Step 7 - Set Up Health Screening (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Small Businesses: Step 7 - Set Up Health Screening (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Small Businesses: Step 7 - Set Up Health Screening (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_45',
        title: 'Reopening Small Businesses: Step 8 - Market Your Business (Covid-19 Best Practices)',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Reopening Small Businesses: Step 8 - Market Your Business (Covid-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Small Businesses: Step 8 - Market Your Business (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Small Businesses: Step 8 - Market Your Business (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Small Businesses: Step 8 - Market Your Business (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Small Businesses: Step 8 - Market Your Business (Covid-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_46',
        title: 'Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Child Care Facilities',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Child Care Facilities',
        tasks: [
          {
                    task: "Task 1 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Child Care Facilities",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Child Care Facilities",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Child Care Facilities",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Child Care Facilities",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Child Care Facilities",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Child Care Facilities",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Child Care Facilities",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_47',
        title: 'Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Colleges and Universities',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Colleges and Universities',
        tasks: [
          {
                    task: "Task 1 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Colleges and Universities",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Colleges and Universities",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Colleges and Universities",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Colleges and Universities",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Colleges and Universities",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Colleges and Universities",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Colleges and Universities",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Colleges and Universities",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Colleges and Universities",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_48',
        title: 'Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Homeless Shelters',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Homeless Shelters',
        tasks: [
          {
                    task: "Task 1 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Homeless Shelters",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Homeless Shelters",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Homeless Shelters",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Homeless Shelters",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Homeless Shelters",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Homeless Shelters",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Homeless Shelters",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Homeless Shelters",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Homeless Shelters",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_49',
        title: 'Cleaning Checklist for Homeless Shelters',
        industry: 'Facility Maintenance',
        description: 'Standard checklist for Cleaning Checklist for Homeless Shelters',
        tasks: [
          {
                    task: "Task 1 for Cleaning Checklist for Homeless Shelters",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Cleaning Checklist for Homeless Shelters",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Cleaning Checklist for Homeless Shelters",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Cleaning Checklist for Homeless Shelters",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Cleaning Checklist for Homeless Shelters",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Cleaning Checklist for Homeless Shelters",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Cleaning Checklist for Homeless Shelters",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Cleaning Checklist for Homeless Shelters",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Cleaning Checklist for Homeless Shelters",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 10 for Cleaning Checklist for Homeless Shelters",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 11 for Cleaning Checklist for Homeless Shelters",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 12 for Cleaning Checklist for Homeless Shelters",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 13 for Cleaning Checklist for Homeless Shelters",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_50',
        title: 'Cleaning & Disinfecting Protocols for Casinos (COVID-19)',
        industry: 'Property Management',
        description: 'Standard checklist for Cleaning & Disinfecting Protocols for Casinos (COVID-19)',
        tasks: [
          {
                    task: "Task 1 for Cleaning & Disinfecting Protocols for Casinos (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Cleaning & Disinfecting Protocols for Casinos (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Cleaning & Disinfecting Protocols for Casinos (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Cleaning & Disinfecting Protocols for Casinos (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Cleaning & Disinfecting Protocols for Casinos (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Cleaning & Disinfecting Protocols for Casinos (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Cleaning & Disinfecting Protocols for Casinos (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Cleaning & Disinfecting Protocols for Casinos (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Cleaning & Disinfecting Protocols for Casinos (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 10 for Cleaning & Disinfecting Protocols for Casinos (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 11 for Cleaning & Disinfecting Protocols for Casinos (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 12 for Cleaning & Disinfecting Protocols for Casinos (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 13 for Cleaning & Disinfecting Protocols for Casinos (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 14 for Cleaning & Disinfecting Protocols for Casinos (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_51',
        title: 'Reopening Casinos - Workplace Specific Plan (COVID-19 Best Practices)',
        industry: 'Property Management',
        description: 'Standard checklist for Reopening Casinos - Workplace Specific Plan (COVID-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Casinos - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Casinos - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Casinos - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Casinos - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Casinos - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening Casinos - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening Casinos - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Reopening Casinos - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_52',
        title: 'Reopening Casinos - Topics for Worker Training (COVID-19 Best Practices)',
        industry: 'Property Management',
        description: 'Standard checklist for Reopening Casinos - Topics for Worker Training (COVID-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Casinos - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Casinos - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Casinos - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Casinos - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Casinos - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening Casinos - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening Casinos - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Reopening Casinos - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Reopening Casinos - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 10 for Reopening Casinos - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_53',
        title: 'Reopening Casinos - Individual Control Measures (COVID-19 Best Practices)',
        industry: 'Property Management',
        description: 'Standard checklist for Reopening Casinos - Individual Control Measures (COVID-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Casinos - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Casinos - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Casinos - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Casinos - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Casinos - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening Casinos - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening Casinos - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_54',
        title: 'Reopening Casinos - Cleaning & Disinfecting (COVID-19 Best Practices)',
        industry: 'Property Management',
        description: 'Standard checklist for Reopening Casinos - Cleaning & Disinfecting (COVID-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Casinos - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Casinos - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Casinos - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Casinos - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Casinos - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening Casinos - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening Casinos - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Reopening Casinos - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Reopening Casinos - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 10 for Reopening Casinos - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 11 for Reopening Casinos - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 12 for Reopening Casinos - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 13 for Reopening Casinos - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 14 for Reopening Casinos - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 15 for Reopening Casinos - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 16 for Reopening Casinos - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 17 for Reopening Casinos - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_55',
        title: 'Reopening Casinos - Physical Distancing Guidelines (COVID-19 Best Practices)',
        industry: 'Property Management',
        description: 'Standard checklist for Reopening Casinos - Physical Distancing Guidelines (COVID-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Casinos - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Casinos - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Casinos - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Casinos - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Casinos - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening Casinos - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening Casinos - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Reopening Casinos - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Reopening Casinos - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 10 for Reopening Casinos - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 11 for Reopening Casinos - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_56',
        title: 'Reopening Casinos - Additional Guidelines for Interacting with the Public (COVID-19 Best Practices)',
        industry: 'Property Management',
        description: 'Standard checklist for Reopening Casinos - Additional Guidelines for Interacting with the Public (COVID-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Casinos - Additional Guidelines for Interacting with the Public (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Casinos - Additional Guidelines for Interacting with the Public (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Casinos - Additional Guidelines for Interacting with the Public (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Casinos - Additional Guidelines for Interacting with the Public (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Casinos - Additional Guidelines for Interacting with the Public (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening Casinos - Additional Guidelines for Interacting with the Public (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening Casinos - Additional Guidelines for Interacting with the Public (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Reopening Casinos - Additional Guidelines for Interacting with the Public (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Reopening Casinos - Additional Guidelines for Interacting with the Public (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_57',
        title: 'Reopening Family Entertainment Centers - Workplace Specific Plan (COVID-19 Best Practices)',
        industry: 'Property Management',
        description: 'Standard checklist for Reopening Family Entertainment Centers - Workplace Specific Plan (COVID-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Family Entertainment Centers - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Family Entertainment Centers - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Family Entertainment Centers - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Family Entertainment Centers - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Family Entertainment Centers - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening Family Entertainment Centers - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening Family Entertainment Centers - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_58',
        title: 'Reopening Family Entertainment Centers - Topics for Worker Training (COVID-19 Best Practices)',
        industry: 'Property Management',
        description: 'Standard checklist for Reopening Family Entertainment Centers - Topics for Worker Training (COVID-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Family Entertainment Centers - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Family Entertainment Centers - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Family Entertainment Centers - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Family Entertainment Centers - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Family Entertainment Centers - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening Family Entertainment Centers - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening Family Entertainment Centers - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Reopening Family Entertainment Centers - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Reopening Family Entertainment Centers - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 10 for Reopening Family Entertainment Centers - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_59',
        title: 'Reopening Family Entertainment Centers - Individual Control Measures (COVID-19 Best Practices)',
        industry: 'Property Management',
        description: 'Standard checklist for Reopening Family Entertainment Centers - Individual Control Measures (COVID-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Family Entertainment Centers - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Family Entertainment Centers - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Family Entertainment Centers - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Family Entertainment Centers - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Family Entertainment Centers - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening Family Entertainment Centers - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening Family Entertainment Centers - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Reopening Family Entertainment Centers - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_60',
        title: 'Reopening Family Entertainment Centers - Physical Distancing Guidelines (COVID-19 Best Practices)',
        industry: 'Property Management',
        description: 'Standard checklist for Reopening Family Entertainment Centers - Physical Distancing Guidelines (COVID-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Family Entertainment Centers - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Family Entertainment Centers - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Family Entertainment Centers - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Family Entertainment Centers - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Family Entertainment Centers - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening Family Entertainment Centers - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening Family Entertainment Centers - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Reopening Family Entertainment Centers - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Reopening Family Entertainment Centers - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 10 for Reopening Family Entertainment Centers - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 11 for Reopening Family Entertainment Centers - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 12 for Reopening Family Entertainment Centers - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 13 for Reopening Family Entertainment Centers - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 14 for Reopening Family Entertainment Centers - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 15 for Reopening Family Entertainment Centers - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 16 for Reopening Family Entertainment Centers - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 17 for Reopening Family Entertainment Centers - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 18 for Reopening Family Entertainment Centers - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 19 for Reopening Family Entertainment Centers - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 20 for Reopening Family Entertainment Centers - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_61',
        title: 'Reopening Family Entertainment Centers - Additional Guidelines for Indoor Movie Theaters (COVID-19 Best Practices)',
        industry: 'Property Management',
        description: 'Standard checklist for Reopening Family Entertainment Centers - Additional Guidelines for Indoor Movie Theaters (COVID-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Family Entertainment Centers - Additional Guidelines for Indoor Movie Theaters (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Family Entertainment Centers - Additional Guidelines for Indoor Movie Theaters (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Family Entertainment Centers - Additional Guidelines for Indoor Movie Theaters (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Family Entertainment Centers - Additional Guidelines for Indoor Movie Theaters (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Family Entertainment Centers - Additional Guidelines for Indoor Movie Theaters (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening Family Entertainment Centers - Additional Guidelines for Indoor Movie Theaters (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening Family Entertainment Centers - Additional Guidelines for Indoor Movie Theaters (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Reopening Family Entertainment Centers - Additional Guidelines for Indoor Movie Theaters (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Reopening Family Entertainment Centers - Additional Guidelines for Indoor Movie Theaters (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_62',
        title: 'Reopening Amusement Parks: Maintaining Healthy Environments (COVID-19 Best Practices)',
        industry: 'Property Management',
        description: 'Standard checklist for Reopening Amusement Parks: Maintaining Healthy Environments (COVID-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Amusement Parks: Maintaining Healthy Environments (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Amusement Parks: Maintaining Healthy Environments (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Amusement Parks: Maintaining Healthy Environments (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Amusement Parks: Maintaining Healthy Environments (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Amusement Parks: Maintaining Healthy Environments (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening Amusement Parks: Maintaining Healthy Environments (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening Amusement Parks: Maintaining Healthy Environments (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Reopening Amusement Parks: Maintaining Healthy Environments (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Reopening Amusement Parks: Maintaining Healthy Environments (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 10 for Reopening Amusement Parks: Maintaining Healthy Environments (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 11 for Reopening Amusement Parks: Maintaining Healthy Environments (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 12 for Reopening Amusement Parks: Maintaining Healthy Environments (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 13 for Reopening Amusement Parks: Maintaining Healthy Environments (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 14 for Reopening Amusement Parks: Maintaining Healthy Environments (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 15 for Reopening Amusement Parks: Maintaining Healthy Environments (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 16 for Reopening Amusement Parks: Maintaining Healthy Environments (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 17 for Reopening Amusement Parks: Maintaining Healthy Environments (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 18 for Reopening Amusement Parks: Maintaining Healthy Environments (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 19 for Reopening Amusement Parks: Maintaining Healthy Environments (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 20 for Reopening Amusement Parks: Maintaining Healthy Environments (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 21 for Reopening Amusement Parks: Maintaining Healthy Environments (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 22 for Reopening Amusement Parks: Maintaining Healthy Environments (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 23 for Reopening Amusement Parks: Maintaining Healthy Environments (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 24 for Reopening Amusement Parks: Maintaining Healthy Environments (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_63',
        title: 'Reopening Amusement Parks: Promoting Behaviors that Reduce Spread (COVID-19 Best Practices)',
        industry: 'Property Management',
        description: 'Standard checklist for Reopening Amusement Parks: Promoting Behaviors that Reduce Spread (COVID-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Amusement Parks: Promoting Behaviors that Reduce Spread (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Amusement Parks: Promoting Behaviors that Reduce Spread (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Amusement Parks: Promoting Behaviors that Reduce Spread (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Amusement Parks: Promoting Behaviors that Reduce Spread (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Amusement Parks: Promoting Behaviors that Reduce Spread (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening Amusement Parks: Promoting Behaviors that Reduce Spread (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening Amusement Parks: Promoting Behaviors that Reduce Spread (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Reopening Amusement Parks: Promoting Behaviors that Reduce Spread (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Reopening Amusement Parks: Promoting Behaviors that Reduce Spread (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 10 for Reopening Amusement Parks: Promoting Behaviors that Reduce Spread (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 11 for Reopening Amusement Parks: Promoting Behaviors that Reduce Spread (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 12 for Reopening Amusement Parks: Promoting Behaviors that Reduce Spread (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 13 for Reopening Amusement Parks: Promoting Behaviors that Reduce Spread (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 14 for Reopening Amusement Parks: Promoting Behaviors that Reduce Spread (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 15 for Reopening Amusement Parks: Promoting Behaviors that Reduce Spread (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 16 for Reopening Amusement Parks: Promoting Behaviors that Reduce Spread (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_64',
        title: 'Cleaning & Disinfecting Protocols for Retail Stores (COVID-19)',
        industry: 'Property Management',
        description: 'Standard checklist for Cleaning & Disinfecting Protocols for Retail Stores (COVID-19)',
        tasks: [
          {
                    task: "Task 1 for Cleaning & Disinfecting Protocols for Retail Stores (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Cleaning & Disinfecting Protocols for Retail Stores (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Cleaning & Disinfecting Protocols for Retail Stores (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Cleaning & Disinfecting Protocols for Retail Stores (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Cleaning & Disinfecting Protocols for Retail Stores (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Cleaning & Disinfecting Protocols for Retail Stores (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Cleaning & Disinfecting Protocols for Retail Stores (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Cleaning & Disinfecting Protocols for Retail Stores (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Cleaning & Disinfecting Protocols for Retail Stores (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 10 for Cleaning & Disinfecting Protocols for Retail Stores (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 11 for Cleaning & Disinfecting Protocols for Retail Stores (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 12 for Cleaning & Disinfecting Protocols for Retail Stores (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 13 for Cleaning & Disinfecting Protocols for Retail Stores (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_65',
        title: 'Cleaning & Disinfecting Protocols for Places of Worship (COVID-19)',
        industry: 'Property Management',
        description: 'Standard checklist for Cleaning & Disinfecting Protocols for Places of Worship (COVID-19)',
        tasks: [
          {
                    task: "Task 1 for Cleaning & Disinfecting Protocols for Places of Worship (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Cleaning & Disinfecting Protocols for Places of Worship (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Cleaning & Disinfecting Protocols for Places of Worship (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Cleaning & Disinfecting Protocols for Places of Worship (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Cleaning & Disinfecting Protocols for Places of Worship (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Cleaning & Disinfecting Protocols for Places of Worship (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Cleaning & Disinfecting Protocols for Places of Worship (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Cleaning & Disinfecting Protocols for Places of Worship (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Cleaning & Disinfecting Protocols for Places of Worship (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 10 for Cleaning & Disinfecting Protocols for Places of Worship (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 11 for Cleaning & Disinfecting Protocols for Places of Worship (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 12 for Cleaning & Disinfecting Protocols for Places of Worship (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 13 for Cleaning & Disinfecting Protocols for Places of Worship (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 14 for Cleaning & Disinfecting Protocols for Places of Worship (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 15 for Cleaning & Disinfecting Protocols for Places of Worship (COVID-19)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_66',
        title: 'Places of Worship - Workplace Specific Plan (COVID-19 Best Practices)',
        industry: 'Property Management',
        description: 'Standard checklist for Places of Worship - Workplace Specific Plan (COVID-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Places of Worship - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Places of Worship - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Places of Worship - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Places of Worship - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Places of Worship - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Places of Worship - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Places of Worship - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_67',
        title: 'Places of Worship - Topics for Worker Training (COVID-19 Best Practices)',
        industry: 'Property Management',
        description: 'Standard checklist for Places of Worship - Topics for Worker Training (COVID-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Places of Worship - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Places of Worship - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Places of Worship - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Places of Worship - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Places of Worship - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Places of Worship - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Places of Worship - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Places of Worship - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Places of Worship - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 10 for Places of Worship - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_68',
        title: 'Places of Worship - Individual Control Measures (COVID-19 Best Practices)',
        industry: 'Property Management',
        description: 'Standard checklist for Places of Worship - Individual Control Measures (COVID-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Places of Worship - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Places of Worship - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Places of Worship - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Places of Worship - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Places of Worship - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Places of Worship - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Places of Worship - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Places of Worship - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_69',
        title: 'Places of Worship - Cleaning & Disinfecting (COVID-19 Best Practices)',
        industry: 'Property Management',
        description: 'Standard checklist for Places of Worship - Cleaning & Disinfecting (COVID-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Places of Worship - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Places of Worship - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Places of Worship - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Places of Worship - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Places of Worship - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Places of Worship - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Places of Worship - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Places of Worship - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Places of Worship - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 10 for Places of Worship - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 11 for Places of Worship - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 12 for Places of Worship - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 13 for Places of Worship - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 14 for Places of Worship - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 15 for Places of Worship - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 16 for Places of Worship - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 17 for Places of Worship - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 18 for Places of Worship - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 19 for Places of Worship - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_70',
        title: 'Places of Worship - Other Considerations (COVID-19 Best Practices)',
        industry: 'Property Management',
        description: 'Standard checklist for Places of Worship - Other Considerations (COVID-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Places of Worship - Other Considerations (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Places of Worship - Other Considerations (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Places of Worship - Other Considerations (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Places of Worship - Other Considerations (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Places of Worship - Other Considerations (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Places of Worship - Other Considerations (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Places of Worship - Other Considerations (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_71',
        title: 'Reopening Fitness Centers and Gyms - Cleaning & Disinfecting (COVID-19 Best Practices)',
        industry: 'Property Management',
        description: 'Standard checklist for Reopening Fitness Centers and Gyms - Cleaning & Disinfecting (COVID-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Fitness Centers and Gyms - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Fitness Centers and Gyms - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Fitness Centers and Gyms - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Fitness Centers and Gyms - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Fitness Centers and Gyms - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening Fitness Centers and Gyms - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening Fitness Centers and Gyms - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Reopening Fitness Centers and Gyms - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Reopening Fitness Centers and Gyms - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 10 for Reopening Fitness Centers and Gyms - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 11 for Reopening Fitness Centers and Gyms - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 12 for Reopening Fitness Centers and Gyms - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 13 for Reopening Fitness Centers and Gyms - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 14 for Reopening Fitness Centers and Gyms - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 15 for Reopening Fitness Centers and Gyms - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 16 for Reopening Fitness Centers and Gyms - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 17 for Reopening Fitness Centers and Gyms - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 18 for Reopening Fitness Centers and Gyms - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 19 for Reopening Fitness Centers and Gyms - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 20 for Reopening Fitness Centers and Gyms - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 21 for Reopening Fitness Centers and Gyms - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 22 for Reopening Fitness Centers and Gyms - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 23 for Reopening Fitness Centers and Gyms - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 24 for Reopening Fitness Centers and Gyms - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 25 for Reopening Fitness Centers and Gyms - Cleaning & Disinfecting (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_72',
        title: 'Reopening Fitness Centers and Gyms - Individual Control Measures (COVID-19 Best Practices)',
        industry: 'Property Management',
        description: 'Standard checklist for Reopening Fitness Centers and Gyms - Individual Control Measures (COVID-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Fitness Centers and Gyms - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Fitness Centers and Gyms - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Fitness Centers and Gyms - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Fitness Centers and Gyms - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Fitness Centers and Gyms - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening Fitness Centers and Gyms - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening Fitness Centers and Gyms - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Reopening Fitness Centers and Gyms - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Reopening Fitness Centers and Gyms - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 10 for Reopening Fitness Centers and Gyms - Individual Control Measures (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_73',
        title: 'Reopening Fitness Centers and Gyms - Physical Distancing Guidelines (COVID-19 Best Practices)',
        industry: 'Property Management',
        description: 'Standard checklist for Reopening Fitness Centers and Gyms - Physical Distancing Guidelines (COVID-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Fitness Centers and Gyms - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Fitness Centers and Gyms - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Fitness Centers and Gyms - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Fitness Centers and Gyms - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Fitness Centers and Gyms - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening Fitness Centers and Gyms - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening Fitness Centers and Gyms - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Reopening Fitness Centers and Gyms - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Reopening Fitness Centers and Gyms - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 10 for Reopening Fitness Centers and Gyms - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 11 for Reopening Fitness Centers and Gyms - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 12 for Reopening Fitness Centers and Gyms - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 13 for Reopening Fitness Centers and Gyms - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 14 for Reopening Fitness Centers and Gyms - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 15 for Reopening Fitness Centers and Gyms - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 16 for Reopening Fitness Centers and Gyms - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 17 for Reopening Fitness Centers and Gyms - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 18 for Reopening Fitness Centers and Gyms - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 19 for Reopening Fitness Centers and Gyms - Physical Distancing Guidelines (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_74',
        title: 'Reopening Fitness Centers and Gyms - Restrooms & Shower Facilities (COVID-19 Best Practices)',
        industry: 'Property Management',
        description: 'Standard checklist for Reopening Fitness Centers and Gyms - Restrooms & Shower Facilities (COVID-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Fitness Centers and Gyms - Restrooms & Shower Facilities (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Fitness Centers and Gyms - Restrooms & Shower Facilities (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Fitness Centers and Gyms - Restrooms & Shower Facilities (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Fitness Centers and Gyms - Restrooms & Shower Facilities (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Fitness Centers and Gyms - Restrooms & Shower Facilities (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening Fitness Centers and Gyms - Restrooms & Shower Facilities (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening Fitness Centers and Gyms - Restrooms & Shower Facilities (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Reopening Fitness Centers and Gyms - Restrooms & Shower Facilities (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Reopening Fitness Centers and Gyms - Restrooms & Shower Facilities (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 10 for Reopening Fitness Centers and Gyms - Restrooms & Shower Facilities (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_75',
        title: 'Reopening Fitness Centers and Gyms - Swimming Pools & Aquatic Venues (COVID-19 Best Practices)',
        industry: 'Property Management',
        description: 'Standard checklist for Reopening Fitness Centers and Gyms - Swimming Pools & Aquatic Venues (COVID-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Fitness Centers and Gyms - Swimming Pools & Aquatic Venues (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Fitness Centers and Gyms - Swimming Pools & Aquatic Venues (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Fitness Centers and Gyms - Swimming Pools & Aquatic Venues (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Fitness Centers and Gyms - Swimming Pools & Aquatic Venues (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Fitness Centers and Gyms - Swimming Pools & Aquatic Venues (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening Fitness Centers and Gyms - Swimming Pools & Aquatic Venues (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening Fitness Centers and Gyms - Swimming Pools & Aquatic Venues (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Reopening Fitness Centers and Gyms - Swimming Pools & Aquatic Venues (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Reopening Fitness Centers and Gyms - Swimming Pools & Aquatic Venues (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 10 for Reopening Fitness Centers and Gyms - Swimming Pools & Aquatic Venues (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 11 for Reopening Fitness Centers and Gyms - Swimming Pools & Aquatic Venues (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 12 for Reopening Fitness Centers and Gyms - Swimming Pools & Aquatic Venues (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 13 for Reopening Fitness Centers and Gyms - Swimming Pools & Aquatic Venues (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 14 for Reopening Fitness Centers and Gyms - Swimming Pools & Aquatic Venues (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 15 for Reopening Fitness Centers and Gyms - Swimming Pools & Aquatic Venues (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 16 for Reopening Fitness Centers and Gyms - Swimming Pools & Aquatic Venues (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 17 for Reopening Fitness Centers and Gyms - Swimming Pools & Aquatic Venues (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_76',
        title: 'Reopening Fitness Centers and Gyms - Topics for Worker Training (COVID-19 Best Practices)',
        industry: 'Property Management',
        description: 'Standard checklist for Reopening Fitness Centers and Gyms - Topics for Worker Training (COVID-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Fitness Centers and Gyms - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Fitness Centers and Gyms - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Fitness Centers and Gyms - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Fitness Centers and Gyms - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Fitness Centers and Gyms - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening Fitness Centers and Gyms - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening Fitness Centers and Gyms - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Reopening Fitness Centers and Gyms - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Reopening Fitness Centers and Gyms - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 10 for Reopening Fitness Centers and Gyms - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 11 for Reopening Fitness Centers and Gyms - Topics for Worker Training (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_extracted_77',
        title: 'Reopening Fitness Centers and Gyms - Workplace Specific Plan (COVID-19 Best Practices)',
        industry: 'Property Management',
        description: 'Standard checklist for Reopening Fitness Centers and Gyms - Workplace Specific Plan (COVID-19 Best Practices)',
        tasks: [
          {
                    task: "Task 1 for Reopening Fitness Centers and Gyms - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 2 for Reopening Fitness Centers and Gyms - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 3 for Reopening Fitness Centers and Gyms - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 4 for Reopening Fitness Centers and Gyms - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 5 for Reopening Fitness Centers and Gyms - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 6 for Reopening Fitness Centers and Gyms - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 7 for Reopening Fitness Centers and Gyms - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 8 for Reopening Fitness Centers and Gyms - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          },
          {
                    task: "Task 9 for Reopening Fitness Centers and Gyms - Workplace Specific Plan (COVID-19 Best Practices)",
                    dataType: "CHECKBOX",
                    isRequired: true
          }
]
    },
    {
        id: 'tmpl_ag_1',
        title: 'Heavy Equipment Pre-Use Inspection',
        industry: 'Agriculture',
        description: 'Comprehensive 22-point inspection for heavy machinery.',
        tasks: [
            { task: 'Ensure exhaust system is secure', dataType: 'SELECT', isRequired: true },
            { task: 'Ensure gauges are visible and functioning', dataType: 'SELECT', isRequired: true },
            { task: 'Check battery for corrosion, loose terminals, and secure mounting', dataType: 'SELECT', isRequired: true },
            { task: 'Check the engine oil level is between add and full marks', dataType: 'SELECT', isRequired: true },
            { task: 'Check fittings, deflectors, safety latches, and pins', dataType: 'SELECT', isRequired: true },
            { task: 'Check steering components are straight and free of play', dataType: 'SELECT', isRequired: true },
            { task: 'Ensure windows have no damages, tears, or cracks', dataType: 'SELECT', isRequired: true },
            { task: 'Ensure exhaust system is complete with a tight seal', dataType: 'SELECT', isRequired: true },
            { task: 'Ensure fuel system is free of leaks and damages', dataType: 'SELECT', isRequired: true },
            { task: 'Check cooling system for leaks and that belts are tight', dataType: 'SELECT', isRequired: true }
        ]
    },
    {
        id: 'tmpl_ag_2',
        title: 'Agriculture & Livestock Industry - Workplace Specific Plan (COVID-19)',
        industry: 'Agriculture',
        description: 'COVID-19 Best Practices for Workplace Specific Plan',
        tasks: [
            { task: 'Designate a person to implement the plan', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Perform risk assessment of all work areas', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Provide training to all workers', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Evaluate control measures regularly', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Investigate any COVID-19 illness', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Identify close contacts of infected workers', dataType: 'PASS_FAIL', isRequired: true }
        ]
    },
    {
        id: 'tmpl_ag_3',
        title: 'Agriculture & Livestock Industry - Topics for Worker Training (COVID-19)',
        industry: 'Agriculture',
        description: 'COVID-19 Best Practices for Worker Training',
        tasks: [
            { task: 'Train on COVID-19 symptoms', dataType: 'CHECKBOX', isRequired: true },
            { task: 'Train on how COVID-19 is spread', dataType: 'CHECKBOX', isRequired: true },
            { task: 'Train on preventing spread (handwashing)', dataType: 'CHECKBOX', isRequired: true },
            { task: 'Train on physical distancing guidelines', dataType: 'CHECKBOX', isRequired: true },
            { task: 'Train on proper use of face coverings', dataType: 'CHECKBOX', isRequired: true },
            { task: 'Inform workers of sick leave benefits', dataType: 'CHECKBOX', isRequired: true }
        ]
    },
    {
        id: 'tmpl_ag_4',
        title: 'Agriculture & Livestock Industry - Cleaning & Disinfecting (COVID-19)',
        industry: 'Agriculture',
        description: 'COVID-19 Best Practices for Cleaning and Disinfecting',
        tasks: [
            { task: 'Clean frequently touched surfaces daily', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Equip areas with hand sanitizer', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Ensure proper ventilation in indoor spaces', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Provide EPA-approved disinfectants', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Clean shared tools between shifts', dataType: 'PASS_FAIL', isRequired: true }
        ]
    },
    {
        id: 'tmpl_ag_5',
        title: 'Agriculture & Livestock Industry - Physical Distancing (COVID-19)',
        industry: 'Agriculture',
        description: 'COVID-19 Best Practices for Physical Distancing',
        tasks: [
            { task: 'Maintain 6 feet of distance between workers', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Stagger break times and shifts', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Limit number of riders in shared vehicles', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Reconfigure workstations to allow distancing', dataType: 'PASS_FAIL', isRequired: true }
        ]
    },
    {
        id: 'tmpl_pm_1',
        title: 'Apartment Turnover Inspection',
        industry: 'Property Management',
        description: 'Comprehensive inspection between tenant move-out and move-in.',
        tasks: [
            { task: 'Check all plumbing fixtures for leaks', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Test smoke and carbon monoxide detectors', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Inspect condition of carpets and flooring', dataType: 'CHECKBOX', isRequired: true },
            { task: 'Verify all light bulbs are working', dataType: 'CHECKBOX', isRequired: true }
        ]
    },
    {
        id: 'tmpl_fm_1',
        title: 'Roof of Building Inspection - Bi-Annual',
        industry: 'Facility Maintenance',
        description: 'Bi-Annual inspection of the building roof.',
        tasks: [
            { task: 'Check asphalt shingles on the ridge, hips, and at roof edges.', dataType: 'SELECT', isRequired: true },
            { task: 'Check clay tiles for: 1. broken tiles, 2. missing tiles, 3. nails popping up.', dataType: 'SELECT', isRequired: true },
            { task: 'Check slate for: 1. broken slates, 2. missing slates, 3. slates flaking apart.', dataType: 'SELECT', isRequired: true },
            { task: 'Check metal for: 1. rust or corrosion spots, 2. signs of previous patch jobs.', dataType: 'SELECT', isRequired: true },
            { task: 'Check wood shingles and shakes for: 1. biological attack (moss or mold, insects, and birds).', dataType: 'SELECT', isRequired: true },
            { task: 'If you have built-up or membrane roof, check for: 1. blisters.', dataType: 'SELECT', isRequired: true }
        ]
    },
    {
        id: 'tmpl_fm_2',
        title: 'Heating Elements of Building Inspection - Bi-Annual',
        industry: 'Facility Maintenance',
        description: 'Bi-Annual inspection of heating elements.',
        tasks: [
            { task: 'Check for gas leaks around the furnace or boiler.', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Inspect the heat exchanger for cracks or rust.', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Test the thermostat to ensure it is communicating with the heating system properly.', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Check the burner for proper ignition and flame characteristics.', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Inspect the flue and venting system for blockages or corrosion.', dataType: 'PASS_FAIL', isRequired: true }
        ]
    },
    {
        id: 'tmpl_fm_3',
        title: 'Interior of Building Inspection',
        industry: 'Facility Maintenance',
        description: 'Comprehensive inspection of the building interior.',
        tasks: [
            { task: 'Check all doors for proper closing and latching.', dataType: 'CHECKBOX', isRequired: true },
            { task: 'Inspect walls and ceilings for signs of water damage or cracks.', dataType: 'CHECKBOX', isRequired: true },
            { task: 'Verify all emergency exit signs are illuminated.', dataType: 'CHECKBOX', isRequired: true },
            { task: 'Inspect flooring for trip hazards (loose carpets, cracked tiles).', dataType: 'CHECKBOX', isRequired: true },
            { task: 'Check all windows for proper sealing and lock function.', dataType: 'CHECKBOX', isRequired: true }
        ]
    },
    {
        id: 'tmpl_fm_4',
        title: 'Exterior Wall Material of Building Inspection - Bi-Annual',
        industry: 'Facility Maintenance',
        description: 'Bi-Annual inspection of exterior wall materials.',
        tasks: [
            { task: 'Inspect brickwork for spalling or loose mortar.', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Check siding for cracks, rot, or peeling paint.', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Look for signs of moisture penetration or staining.', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Ensure weep holes are clear and functioning.', dataType: 'PASS_FAIL', isRequired: true }
        ]
    },
    {
        id: 'tmpl_1',
        title: 'Truck/Bus/Van/Pickup Pre-Use Inspection',
        industry: 'Fleet Management',
        description: 'Standard DOT-aligned pre-trip inspection checklist for commercial vehicles.',
        tasks: [
            { task: 'Check engine oil level', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Check tire pressure and condition', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Ensure lights and signals are working', dataType: 'CHECKBOX', isRequired: true },
            { task: 'Record starting mileage', dataType: 'NUMBER', isRequired: true },
            { task: 'Inspect brakes and steering', dataType: 'PASS_FAIL', isRequired: true }
        ]
    },
    {
        id: 'tmpl_fs_1',
        title: 'Daily Food Safety Inspection',
        industry: 'Food Service',
        description: 'Daily inspection to ensure health code compliance.',
        tasks: [
            { task: 'Check refrigerator temperatures (must be under 40°F)', dataType: 'NUMBER', isRequired: true },
            { task: 'Check freezer temperatures (must be under 0°F)', dataType: 'NUMBER', isRequired: true },
            { task: 'Ensure all food items are properly labeled and dated', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Verify sanitizing buckets have correct chemical concentration', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Ensure handwashing stations are stocked with soap and towels', dataType: 'CHECKBOX', isRequired: true }
        ]
    },
    {
        id: 'tmpl_fs_2',
        title: 'Deep Cleaning Checklist',
        industry: 'Food Service',
        description: 'Comprehensive kitchen deep cleaning procedures.',
        tasks: [
            { task: 'Clean and sanitize all prep surfaces', dataType: 'CHECKBOX', isRequired: true },
            { task: 'Degrease exhaust hoods and filters', dataType: 'CHECKBOX', isRequired: true },
            { task: 'Empty and sanitize grease traps', dataType: 'CHECKBOX', isRequired: true },
            { task: 'Sweep and mop all floors, including under equipment', dataType: 'CHECKBOX', isRequired: true }
        ]
    },
    {
        id: 'tmpl_hc_1',
        title: 'Patient Room Turnover Cleaning',
        industry: 'Healthcare',
        description: 'Standard cleaning procedure for patient discharge.',
        tasks: [
            { task: 'Remove all medical waste and dispose in biohazard bins', dataType: 'CHECKBOX', isRequired: true },
            { task: 'Strip all linens and place in appropriate laundry bags', dataType: 'CHECKBOX', isRequired: true },
            { task: 'Disinfect bed frame, mattress, and side rails', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Clean and disinfect all high-touch surfaces (doorknobs, light switches, remotes)', dataType: 'CHECKBOX', isRequired: true },
            { task: 'Restock soap, paper towels, and hand sanitizer', dataType: 'CHECKBOX', isRequired: true }
        ]
    },
    {
        id: 'tmpl_mfg_1',
        title: 'Forklift Daily Inspection',
        industry: 'Manufacturing',
        description: 'OSHA-compliant daily pre-shift forklift inspection.',
        tasks: [
            { task: 'Check fluid levels (oil, water, hydraulic)', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Inspect tires and forks for damage', dataType: 'CHECKBOX', isRequired: true },
            { task: 'Test horn, lights, and backup alarm', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Check seatbelt functionality', dataType: 'CHECKBOX', isRequired: true }
        ]
    },
    {
        id: 'tmpl_mfg_2',
        title: 'CNC Machine Weekly Preventive Maintenance',
        industry: 'Manufacturing',
        description: 'Weekly PM schedule for CNC milling machines.',
        tasks: [
            { task: 'Check way lube level and top up if necessary', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Inspect coolant condition and concentration', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Clean chips from way covers and wipers', dataType: 'CHECKBOX', isRequired: true },
            { task: 'Check pneumatic pressure and empty water traps', dataType: 'PASS_FAIL', isRequired: true }
        ]
    },
    {
        id: 'tmpl_sf_1',
        title: 'Monthly Fire Extinguisher Inspection',
        industry: 'Safety',
        description: 'NFPA 10 compliant monthly visual inspection for fire extinguishers.',
        tasks: [
            { task: 'Extinguisher is in designated location', dataType: 'CHECKBOX', isRequired: true },
            { task: 'No obstruction to access or visibility', dataType: 'CHECKBOX', isRequired: true },
            { task: 'Pressure gauge is in the green operable range', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Pin and tamper seal are intact', dataType: 'CHECKBOX', isRequired: true }
        ]
    },
    {
        id: 'tmpl_ut_1',
        title: 'Pump Station Weekly Inspection',
        industry: 'Utilities, Oil, and Gas',
        description: 'Weekly routine inspection of water/wastewater pump stations.',
        tasks: [
            { task: 'Record pump running hours (Pump 1)', dataType: 'NUMBER', isRequired: true },
            { task: 'Record pump running hours (Pump 2)', dataType: 'NUMBER', isRequired: true },
            { task: 'Check for abnormal noise or vibration', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Inspect wet well levels and float switches', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Check backup generator fuel level and battery voltage', dataType: 'PASS_FAIL', isRequired: true }
        ]
    },
    {
        id: 'tmpl_2',
        title: 'Steam Traps Inspection - Daily',
        industry: 'Facility Maintenance',
        description: 'Daily visual and acoustic inspection of steam traps.',
        tasks: [
            { task: 'Visual check for steam leaks', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Acoustic check for proper cycling', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Record trap temperature (F)', dataType: 'NUMBER', isRequired: false }
        ]
    },
    {
        id: 'tmpl_3',
        title: 'Forklift Daily Inspection',
        industry: 'Manufacturing',
        description: 'OSHA-compliant daily pre-shift forklift inspection.',
        tasks: [
            { task: 'Check fluid levels (oil, water, hydraulic)', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Inspect tires and forks for damage', dataType: 'CHECKBOX', isRequired: true },
            { task: 'Test horn, lights, and backup alarm', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Check seatbelt functionality', dataType: 'CHECKBOX', isRequired: true }
        ]
    },
    {
        id: 'tmpl_4',
        title: 'Monthly Fire Extinguisher Inspection',
        industry: 'Safety',
        description: 'NFPA 10 compliant monthly visual inspection for fire extinguishers.',
        tasks: [
            { task: 'Extinguisher is in designated location', dataType: 'CHECKBOX', isRequired: true },
            { task: 'No obstruction to access or visibility', dataType: 'CHECKBOX', isRequired: true },
            { task: 'Pressure gauge is in the green operable range', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Pin and tamper seal are intact', dataType: 'CHECKBOX', isRequired: true }
        ]
    },
    {
        id: 'tmpl_5',
        title: 'Deep Cleaning Checklist',
        industry: 'Food Service',
        description: 'Comprehensive kitchen deep cleaning procedures.',
        tasks: [
            { task: 'Clean and sanitize all prep surfaces', dataType: 'CHECKBOX', isRequired: true },
            { task: 'Degrease exhaust hoods and filters', dataType: 'CHECKBOX', isRequired: true },
            { task: 'Empty and sanitize grease traps', dataType: 'CHECKBOX', isRequired: true },
            { task: 'Sweep and mop all floors, including under equipment', dataType: 'CHECKBOX', isRequired: true }
        ]
    },
    {
        id: 'tmpl_6',
        title: 'HVAC Preventive Maintenance - Quarterly',
        industry: 'Facility Maintenance',
        description: 'Quarterly PM tasks for rooftop HVAC units.',
        tasks: [
            { task: 'Replace air filters', dataType: 'CHECKBOX', isRequired: true },
            { task: 'Inspect and clean condensate drain', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Check belts for wear and tension', dataType: 'PASS_FAIL', isRequired: true },
            { task: 'Inspect electrical connections', dataType: 'CHECKBOX', isRequired: true }
        ]
    }
];

export const TemplateLibrary = ({ onChecklistCreated }: { onChecklistCreated: () => void }) => {
    const [selectedIndustry, setSelectedIndustry] = useState('All');
    const [selectedUseCase, setSelectedUseCase] = useState('All');
    const [selectedTemplateId, setSelectedTemplateId] = useState(TEMPLATES[0].id);
    const queryClient = useQueryClient();

    const filteredTemplates = TEMPLATES.filter(t => {
        const matchesIndustry = selectedIndustry === 'All' || t.industry === selectedIndustry;
        const matchesUseCase = selectedUseCase === 'All' || (t.title.toLowerCase().includes(selectedUseCase.toLowerCase()) || t.description.toLowerCase().includes(selectedUseCase.toLowerCase()));
        return matchesIndustry && matchesUseCase;
    });
    const selectedTemplate = TEMPLATES.find(t => t.id === selectedTemplateId) || filteredTemplates[0];

    // Auto-select first template when filter changes
    if (selectedTemplate && filteredTemplates.length > 0 && !filteredTemplates.find(t => t.id === selectedTemplateId)) {
        setSelectedTemplateId(filteredTemplates[0].id);
    }

    const createMutation = useMutation({
        mutationFn: async (template: typeof TEMPLATES[0]) => {
            const payload = {
                title: template.title,
                description: template.description,
                items: template.tasks.map((t, i) => ({
                    task: t.task,
                    type: t.dataType, // The DTO expects 'type' instead of 'dataType'
                    isRequired: t.isRequired,
                    order: i
                }))
            };
            const response = await api.post('/checklists', payload);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Checklist template added to your library!');
            queryClient.invalidateQueries({ queryKey: ['checklists'] });
            onChecklistCreated();
        },
        onError: () => {
            toast.error('Failed to create checklist from template');
        }
    });

    return (
        <div className="flex h-full bg-white overflow-hidden font-inter border-t border-gray-100">
            {/* Left Column: Filters */}
            <div className="w-[280px] border-r border-gray-200 flex flex-col bg-gray-50/30 overflow-y-auto">
                <div className="p-4 pt-6">
                    <h3 className="font-bold text-gray-900 text-[14px] mb-3 px-2">Industry</h3>
                    <div className="space-y-1">
                        {INDUSTRIES.map(industry => (
                            <label 
                                key={industry} 
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                            >
                                <input 
                                    type="radio" 
                                    name="industry"
                                    value={industry}
                                    checked={selectedIndustry === industry}
                                    onChange={() => setSelectedIndustry(industry)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span className={cn(
                                    "text-[14px]", 
                                    selectedIndustry === industry ? "font-bold text-gray-900" : "font-medium text-gray-600"
                                )}>
                                    {industry}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200/60 mt-2">
                    <h3 className="font-bold text-gray-900 text-[14px] mb-3 px-2">Use Case</h3>
                    <div className="space-y-1">
                        {USE_CASES.map(useCase => (
                            <label 
                                key={useCase} 
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                            >
                                <input 
                                    type="radio" 
                                    name="useCase"
                                    value={useCase}
                                    checked={selectedUseCase === useCase}
                                    onChange={() => setSelectedUseCase(useCase)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span className={cn(
                                    "text-[14px]", 
                                    selectedUseCase === useCase ? "font-bold text-gray-900" : "font-medium text-gray-600"
                                )}>
                                    {useCase}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Middle Column: Template List */}
            <div className="w-[400px] border-r border-gray-200 flex flex-col bg-gray-50/10">
                <div className="p-4 border-b border-gray-200 bg-white sticky top-0 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 text-[14px]">{filteredTemplates.length} templates</h3>
                </div>
                <div className="p-4 flex-1 overflow-y-auto space-y-3">
                    {filteredTemplates.map(template => (
                        <div 
                            key={template.id}
                            onClick={() => setSelectedTemplateId(template.id)}
                            className={cn(
                                "p-4 rounded-xl border transition-all cursor-pointer relative",
                                selectedTemplateId === template.id 
                                    ? "bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-500" 
                                    : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm"
                            )}
                        >
                            <h4 className="font-bold text-[14px] text-gray-900 pr-2">{template.title}</h4>
                            <div className="mt-2 text-[12px] font-medium text-gray-500">
                                {template.tasks.length} {template.tasks.length === 1 ? 'task' : 'tasks'}
                            </div>
                        </div>
                    ))}
                    {filteredTemplates.length === 0 && (
                        <div className="text-center p-8 text-gray-500 text-[14px] font-medium">
                            No templates found for this industry.
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Template Preview */}
            <div className="flex-1 flex flex-col bg-gray-50/30">
                {selectedTemplate ? (
                    <>
                        <div className="p-6 border-b border-gray-200 bg-white sticky top-0 flex items-start justify-between">
                            <div className="max-w-xl">
                                <h2 className="text-[20px] font-bold text-gray-900">{selectedTemplate.title}</h2>
                                <p className="text-[14px] text-gray-500 mt-2 font-medium">{selectedTemplate.description}</p>
                            </div>
                            <button 
                                onClick={() => createMutation.mutate(selectedTemplate)}
                                disabled={createMutation.isPending}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[14px] font-bold transition-all shadow-sm active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                                {createMutation.isPending ? 'Adding...' : 'Use Template'}
                            </button>
                        </div>
                        
                        <div className="p-8 flex-1 overflow-y-auto">
                            <div className="max-w-2xl mx-auto space-y-4">
                                <div className="flex items-center gap-2 mb-6 text-gray-800">
                                    <CheckSquare className="w-5 h-5" />
                                    <h3 className="font-bold text-[16px]">Task Preview</h3>
                                </div>
                                
                                {selectedTemplate.tasks.map((task, idx) => (
                                    <div key={idx} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-[14px] text-gray-900">{task.task}</h4>
                                                <div className="mt-3 flex items-center gap-2">
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-md text-gray-600 text-[12px] font-bold">
                                                        {getTaskIcon(task.dataType)}
                                                        {task.dataType.replace('_', ' ')}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-400 mt-1">
                                                <Copy className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <p className="font-medium">Select a template to preview</p>
                    </div>
                )}
            </div>
        </div>
    );
};
