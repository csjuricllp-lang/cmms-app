import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChecklistDto, UpdateChecklistDto } from './dto/checklist.dto';
import { TenancyContext } from '../common/tenancy.context';

@Injectable()
export class ChecklistsService {
  constructor(private prisma: PrismaService) {}

  async create(createChecklistDto: CreateChecklistDto) {
    const organizationId = TenancyContext.organizationId || '';
    const userId = TenancyContext.userId;
    const { items, ...checklistData } = createChecklistDto;

    const checklist = await this.prisma.checklist.create({
      data: {
        ...checklistData,
        organizationId,
        items: {
          create: items,
        },
      },
      include: {
        items: true,
      },
    });

    // CTO Governance: Log the publishing of a new standard
    await this.prisma.auditLog
      .create({
        data: {
          action: 'CHECKLIST_TEMPLATE_CREATED',
          model: 'Checklist',
          entityId: (checklist as any).id,
          userId,
          organizationId,
          newData: checklist as any,
        },
      })
      .catch(() => {});

    return checklist;
  }

  async findAll() {
    const organizationId = TenancyContext.organizationId || '';
    return this.prisma.checklist.findMany({
      where: { 
        OR: [{ organizationId }, { isSystem: true }],
        deletedAt: null 
      },
      include: { items: true },
    });
  }

  async findOne(id: string) {
    const organizationId = TenancyContext.organizationId || '';
    const checklist = await this.prisma.checklist.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { items: true },
    });
    if (!checklist) {
      throw new NotFoundException(`Checklist with ID ${id} not found`);
    }
    return checklist;
  }

  async update(id: string, updateChecklistDto: UpdateChecklistDto) {
    await this.findOne(id);
    const { items, ...checklistData } = updateChecklistDto;

    const updateData: any = { ...checklistData };

    // If items are provided, replace them completely (safest way to handle list mutations)
    if (items) {
      updateData.items = {
        deleteMany: {}, // Clean slate
        create: items, // Add all
      };
    }

    return this.prisma.checklist.update({
      where: { id },
      data: updateData,
      include: { items: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.checklist.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Checklist deleted successfully' };
  }

  async getTemplates() {
    return [
      {
        id: 'template_loto_standard',
        title: 'OSHA standard LOTO procedure',
        description:
          'Industrial-grade Lock-Out Tag-Out procedure for high-voltage and high-pressure assets. Ensures compliance with OSHA 1910.147 and ISO 45001.',
        items: [
          {
            task: 'Prepare for Shutdown: Verify machine ID and identify all energy sources.',
            dataType: 'TEXT_INPUT',
            isRequired: true,
            order: 0,
          },
          {
            task: 'Affected Personnel Notification: Confirm all employees in the vicinity notified.',
            dataType: 'PASS_FAIL',
            isRequired: true,
            order: 1,
          },
          {
            task: 'Physical Isolation: Secure main disconnects or valves using a physical LOTO device.',
            dataType: 'PASS_FAIL',
            isRequired: true,
            order: 2,
          },
          {
            task: 'Safety Tagging: Attach personal identification tag with timestamp and warning.',
            dataType: 'CHECKBOX',
            isRequired: true,
            order: 3,
          },
          {
            task: 'Zero Energy Verification: Use a calibrated voltmeter to verify zero voltage.',
            dataType: 'METER_READING',
            isRequired: true,
            order: 4,
          },
          {
            task: 'Stored Energy Dissipation: Bleed hydraulic/pneumatic lines or ground capacitors.',
            dataType: 'CHECKBOX',
            isRequired: true,
            order: 5,
          },
          {
            task: 'The "Try-Out" Test: Attempt to restart equipment to verify final isolation.',
            dataType: 'PASS_FAIL',
            isRequired: true,
            order: 6,
          },
          {
            task: 'Hazard Zone Inspection: Ensure workspace is clear of bystanders and tools.',
            dataType: 'CHECKBOX',
            isRequired: false,
            order: 7,
          },
        ],
      },
      {
        id: 'template_fire_safety',
        title: 'Fire Suppression System Monthly Audit',
        description:
          'Periodic inspection of fire extinguishers, exit signs, and sprinkler pressure gauges.',
        items: [
          {
            task: 'Extinguisher Inspection: Check pressure gauge, pin, and hose integrity.',
            dataType: 'PASS_FAIL',
            isRequired: true,
            order: 0,
          },
          {
            task: 'Exit Light Test: Verify battery backup on emergency exit signage.',
            dataType: 'PASS_FAIL',
            isRequired: true,
            order: 1,
          },
          {
            task: 'Sprinkler System Pressure: Record main riser psi.',
            dataType: 'NUMBER',
            isRequired: true,
            order: 2,
          },
        ],
      },
      {
        id: 'template_hvac_pm',
        title: 'HVAC Unit Monthly PM (Quarterly)',
        description:
          'Comprehensive efficiency and safety check for rooftop units and AHUs. Optimizes energy consumption and MTBF.',
        items: [
          {
            task: 'Filter Assessment: Inspect and replace if pressure drop > 0.5" WC.',
            dataType: 'PASS_FAIL',
            isRequired: true,
            order: 0,
          },
          {
            task: 'Blower Belt: Verify tension, wear, and pulley alignment.',
            dataType: 'CHECKBOX',
            isRequired: true,
            order: 1,
          },
          {
            task: 'Condensate Drain: Flush drain pan and verify clear flow.',
            dataType: 'CHECKBOX',
            isRequired: true,
            order: 2,
          },
          {
            task: 'Compressor Load: Record operating amperage at full cooling.',
            dataType: 'NUMBER',
            isRequired: false,
            order: 3,
          },
          {
            task: 'Refrigerant Charge: Delta-T or Operating Pressures (PSIG).',
            dataType: 'METER_READING',
            isRequired: true,
            order: 4,
          },
        ],
      },
      {
        id: 'template_forklift_daily',
        title: 'Forklift Pre-Operation Safety Check',
        description:
          'Mandatory daily checklist for powered industrial trucks (PIT). Compliance with OSHA 1910.178.',
        items: [
          {
            task: 'Leak Inspection: Verify no oil or hydraulic fluid on deck/floor.',
            dataType: 'PASS_FAIL',
            isRequired: true,
            order: 0,
          },
          {
            task: 'Tire Condition: Check for chunks, wear, or debris in treads.',
            dataType: 'PASS_FAIL',
            isRequired: true,
            order: 1,
          },
          {
            task: 'Mast & Forks: Inspect for cracks, bends, or heel wear.',
            dataType: 'CHECKBOX',
            isRequired: true,
            order: 2,
          },
          {
            task: 'Braking Systems: Test service and parking brake functionality.',
            dataType: 'PASS_FAIL',
            isRequired: true,
            order: 3,
          },
          {
            task: 'Operating Hours: Record current meter reading.',
            dataType: 'METER_READING',
            isRequired: true,
            order: 4,
          },
        ],
      },
      {
        id: 'template_ac_comprehensive',
        title: 'Comprehensive AC Maintenance Protocol',
        description: 'Advanced 15-point inspection for industrial HVAC systems, optimized for indoor air quality and thermal efficiency.',
        items: [
          { task: 'Clean air filter & check its condition', dataType: 'PASS_FAIL', isRequired: true, order: 1 },
          { task: 'Check & Clean the Evaporator coil', dataType: 'PASS_FAIL', isRequired: true, order: 2 },
          { task: 'Check the condenser coil and clean', dataType: 'PASS_FAIL', isRequired: true, order: 3 },
          { task: 'Check the operation of evaporator fan motor', dataType: 'PASS_FAIL', isRequired: true, order: 4 },
          { task: 'Check the operation of condenser fan motor', dataType: 'PASS_FAIL', isRequired: true, order: 5 },
          { task: 'Check and record operating voltage and Amperes', dataType: 'TEXT_INPUT', isRequired: true, order: 6 },
          { task: 'Check and service drain pump, if any', dataType: 'PASS_FAIL', isRequired: true, order: 7 },
          { task: 'Perform functional test of thermostat', dataType: 'PASS_FAIL', isRequired: true, order: 8 },
          { task: 'Check refrigerant leak in the system', dataType: 'PASS_FAIL', isRequired: true, order: 9 },
          { task: 'Check the refrigerant pressure', dataType: 'METER_READING', isRequired: true, order: 10 },
          { task: 'check and comb dented fins of cooling coil', dataType: 'PASS_FAIL', isRequired: true, order: 11 },
          { task: 'Check the Insulation of the refrigerant pipe', dataType: 'PASS_FAIL', isRequired: true, order: 12 },
          { task: 'Check the Electrical wiring connections', dataType: 'PASS_FAIL', isRequired: true, order: 13 },
          { task: 'Clean electrical components', dataType: 'PASS_FAIL', isRequired: true, order: 14 },
          { task: 'Check any Unusual noise and vibration of the units', dataType: 'PASS_FAIL', isRequired: true, order: 15 },
        ]
      }
    ];
  }

  async generateSmartChecklist(prompt: string, assetId?: string) {
    const p = prompt.toLowerCase();
    let title = 'General Inspection Protocol';
    let description = `Automated maintenance protocol generated for: "${prompt}"`;
    let tasks: any[] = [];

    if (p.includes('pump') || p.includes('motor')) {
      title = 'Mechanical Power Unit Inspection';
      tasks = [
        { label: 'Visual casing inspection', instruction: 'Check for hairline fractures or leaks', type: 'Inspection' },
        { label: 'Bearing temperature check', instruction: 'Use IR thermometer, target < 65°C', type: 'Number' },
        { label: 'Lubrication levels', instruction: 'Verify oil level in sight glass', type: 'Status' },
        { label: 'Vibration analysis', instruction: 'Note any unusual resonance', type: 'Text' },
        { label: 'Mounting bolt torque', instruction: 'Check for loosening from vibration', type: 'Checkbox' },
      ];
    } else if (p.includes('electrical') || p.includes('panel') || p.includes('breaker')) {
      title = 'Electrical Distribution Audit';
      tasks = [
        { label: 'Thermal scan of busbars', instruction: 'Note hotspots > 10°C ambient', type: 'Inspection' },
        { label: 'Conductor tightness', instruction: 'Check for signs of arcing', type: 'Checkbox' },
        { label: 'Grounding continuity', instruction: 'Measure resistance to main earth', type: 'Number' },
        { label: 'Arc flash labeling', instruction: 'Verify labels are legible', type: 'Status' },
        { label: 'Clean cabinet interior', instruction: 'Remove dust and debris', type: 'Checkbox' },
      ];
    } else if (p.includes('hvac') || p.includes('ac') || p.includes('filter')) {
      title = 'HVAC System Performance Review';
      tasks = [
        { label: 'Filter condition', instruction: 'Replace if differential pressure > 0.5"', type: 'Status' },
        { label: 'Condensate drain line', instruction: 'Ensure clear path, no blockages', type: 'Inspection' },
        { label: 'Refrigerant pressure', instruction: 'Note suction and discharge psi', type: 'Number' },
        { label: 'Belt tension', instruction: 'Check for fraying or slippage', type: 'Checkbox' },
        { label: 'Thermostat calibration', instruction: 'Verify against master digital meter', type: 'Inspection' },
      ];
    } else if (p.includes('safety') || p.includes('fire') || p.includes('emergency')) {
      title = 'Life Safety Equipment Audit';
      tasks = [
        { label: 'Exit signage illumination', instruction: 'Test battery backup status', type: 'Inspection' },
        { label: 'Fire extinguisher pressure', instruction: 'Gauge must be in the green zone', type: 'Status' },
        { label: 'Emergency shower flow', instruction: 'Full flow for 60 seconds', type: 'Checkbox' },
        { label: 'Hazardous material storage', instruction: 'Check for secondary containment leaks', type: 'Inspection' },
        { label: 'PPE availability', instruction: 'Verify stock levels of gloves/glasses', type: 'Number' },
      ];
    } else {
      title = 'Industrial Operations Protocol';
      tasks = [
        { label: 'Operational status verify', instruction: 'Note machine state', type: 'Status' },
        { label: 'Clean work area', instruction: 'Remove any hazards', type: 'Checkbox' },
        { label: 'Tool count verification', instruction: 'Ensure no tools left inside machine', type: 'Checkbox' },
        { label: 'Safety guard check', instruction: 'Verify interlocks are functional', type: 'Inspection' },
        { label: 'Log final run hours', instruction: 'Capture from OIT display', type: 'Number' },
      ];
    }

    if (assetId) {
      const asset = await this.prisma.asset.findUnique({ where: { id: assetId } });
      if (asset) {
        title = `${asset.name} - ${title}`;
        description = `Specialized protocol generated for ${asset.name} (${asset.serialNumber || 'N/A'}) based on: "${prompt}"`;
      }
    }

    return { title, description, tasks };
  }
}
