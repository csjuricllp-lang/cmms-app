import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenancyContext } from '../common/tenancy.context';
import * as XLSX from 'xlsx';
import { SystemRole } from '../auth/constants/system-roles';

@Injectable()
export class ImportService {
  constructor(private readonly prisma: PrismaService) {}

  async processTeamsAndPersonnel(file: Express.Multer.File) {
    const organizationId = TenancyContext.organizationId;
    if (!organizationId) {
      throw new BadRequestException('Organization context missing');
    }

    let workbook;
    try {
      workbook = XLSX.read(file.buffer, { type: 'buffer' });
    } catch (e) {
      throw new BadRequestException('Failed to read Excel/CSV file');
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      throw new BadRequestException('The uploaded file is empty');
    }

    const results = {
      teamsCreated: 0,
      usersCreated: 0,
      errors: [] as string[],
    };

    // Use a map to cache team lookups/creations
    const teamMap = new Map<string, string>();

    for (const row of data) {
      try {
        const name = row['Name'] || row['name'];
        const email = row['Email'] || row['email'];
        const roleStr = (row['Role'] || row['role'] || 'TECHNICIAN').toUpperCase();
        const teamName = row['Team'] || row['team'];

        if (!name || !email) {
          results.errors.push(`Row skipped: Missing name or email`);
          continue;
        }

        // 1. Ensure Team exists
        let teamId: string | null = null;
        if (teamName) {
          if (teamMap.has(teamName)) {
            teamId = teamMap.get(teamName)!;
          } else {
            let team = await this.prisma.team.findFirst({
              where: { name: teamName, organizationId },
            });

            if (!team) {
              team = await this.prisma.team.create({
                data: {
                  name: teamName,
                  organizationId,
                },
              });
              results.teamsCreated++;
            }
            teamId = (team as any).id;
            if (teamId) teamMap.set(teamName, teamId);
          }
        }

        // 2. Ensure User exists and is in Org
        let user = await this.prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          user = await this.prisma.user.create({
            data: {
              email,
              name,
              password: '$2b$10$Ep993Wz6F5B/Yp7P9m6Rve/4V1JpL1pL1pL1pL1pL1pL1pL1pL1pL', // Default hash for 'password123'
            },
          });
        }

        let userOrg = await this.prisma.userOrganization.findFirst({
          where: { userId: user.id, organizationId },
        });

        if (!userOrg) {
          // Map string to Role name using SystemRole constants
          let roleName: string = SystemRole.TECHNICIAN;
          const normalizedRole = roleStr.toLowerCase();
          
          if (normalizedRole.includes('admin')) {
            roleName = SystemRole.ADMIN;
          } else if (normalizedRole.includes('manager')) {
            roleName = SystemRole.MANAGER;
          } else if (normalizedRole.includes('requester')) {
            roleName = SystemRole.REQUESTER;
          } else if (normalizedRole.includes('view')) {
            roleName = SystemRole.VIEW_ONLY;
          }

          const role = await this.prisma.role.findFirst({
            where: { name: roleName, organizationId },
          });

          userOrg = await this.prisma.userOrganization.create({
            data: {
              userId: user.id,
              organizationId,
              roleId: role?.id,
            },
          });
          results.usersCreated++;
        }

        // 3. Assign User to Team if provided
        if (teamId) {
          const teamUser = await this.prisma.usersOnTeams.findUnique({
            where: {
              userOrgId_teamId: {
                userOrgId: userOrg.id,
                teamId,
              },
            },
          });

          if (!teamUser) {
            await this.prisma.usersOnTeams.create({
              data: {
                teamId,
                userOrgId: userOrg.id,
              },
            });
          }
        }
      } catch (err: any) {
        results.errors.push(`Error processing row: ${err.message}`);
      }
    }

    return results;
  }

  async generateTemplate() {
    const data = [
      {
        Name: 'John Doe',
        Email: 'john.doe@organization.com',
        Role: SystemRole.TECHNICIAN,
        Team: 'Maintenance Alpha',
      },
      {
        Name: 'Jane Smith',
        Email: 'jane.smith@organization.com',
        Role: SystemRole.ADMIN,
        Team: 'Leadership',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Migration Template');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async generateTeamsExport() {
    const organizationId = TenancyContext.organizationId;
    const teams = await this.prisma.team.findMany({
      where: { organizationId },
      include: {
        users: {
          include: {
            userOrg: {
              include: {
                user: true,
                role: true,
              },
            },
          },
        },
      },
    });

    const exportData: any[] = [];
    teams.forEach((team: any) => {
      if (team.users && team.users.length > 0) {
        team.users.forEach((tu: any) => {
          exportData.push({
            Team: team.name,
            'Team Description': team.description || '',
            'Member Name': tu.userOrg?.user?.name || 'Unknown',
            'Member Email': tu.userOrg?.user?.email || 'Unknown',
            Role: tu.userOrg?.role?.name || SystemRole.TECHNICIAN,
            'Joined Team': tu.assignedAt ? new Date(tu.assignedAt).toLocaleDateString() : '',
          });
        });
      } else {
        exportData.push({
          Team: team.name,
          'Team Description': team.description || '',
          'Member Name': 'No members',
          'Member Email': '',
          Role: '',
          'Joined Team': '',
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Organization Teams');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async processAssets(file: Express.Multer.File) {
    const organizationId = TenancyContext.organizationId;
    if (!organizationId) {
      throw new BadRequestException('Organization context missing');
    }

    let workbook;
    try {
      workbook = XLSX.read(file.buffer, { type: 'buffer' });
    } catch (e) {
      throw new BadRequestException('Failed to read Excel/CSV file');
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      throw new BadRequestException('The uploaded file is empty');
    }

    const results = {
      assetsCreated: 0,
      errors: [] as string[],
    };

    const locationMap = new Map<string, string>(); // Cache location name -> id

    for (const row of data) {
      try {
        const name = row['Asset Name'] || row['asset name'] || row['Name'] || row['name'];
        let status = (row['Status'] || row['status'] || 'OPERATIONAL').toUpperCase();
        const locationName = row['Location Name'] || row['location name'] || row['Location'] || row['location'];
        const description = row['Description'] || row['description'];
        const model = row['Model'] || row['model'];
        const serialNumber = row['Serial Number'] || row['serial number'] || row['SerialNumber'];
        const manufacturer = row['Manufacturer'] || row['manufacturer'];
        const barcode = row['Barcode'] || row['barcode'] || row['QrCode'] || row['QR Code'];
        const category = row['Category'] || row['category'];

        if (!name) {
          results.errors.push(`Row skipped: Missing Asset Name`);
          continue;
        }

        // Normalize status
        if (!['OPERATIONAL', 'UNDER_MAINTENANCE', 'DOWN', 'DECOMMISSIONED'].includes(status)) {
          status = 'OPERATIONAL';
        }

        // Resolve Location Name
        let locationId: string | undefined = undefined;
        if (locationName) {
          if (locationMap.has(locationName)) {
            locationId = locationMap.get(locationName)!;
          } else {
            let location = await this.prisma.location.findFirst({
              where: { name: locationName, organizationId },
            });

            if (!location) {
              location = await this.prisma.location.create({
                data: {
                  name: locationName,
                  organizationId,
                },
              });
            }
            locationId = location.id;
            locationMap.set(locationName, locationId);
          }
        }

        // If no location was found or specified, default to the first available location
        if (!locationId) {
          let defaultLocation = await this.prisma.location.findFirst({
            where: { organizationId }
          });
          if (!defaultLocation) {
            defaultLocation = await this.prisma.location.create({
              data: {
                name: 'Default Location',
                organizationId
              }
            });
          }
          locationId = defaultLocation.id;
        }

        // Create Asset
        await this.prisma.asset.create({
          data: {
            name,
            status,
            description: description || null,
            model: model || null,
            serialNumber: serialNumber || null,
            brand: manufacturer || null,
            barCode: barcode || null,
            category: category || null,
            locationId: locationId, // locationId is strictly required in schema.prisma
            organizationId,
          },
        });

        results.assetsCreated++;
      } catch (err: any) {
        results.errors.push(`Error processing asset "${row['Asset Name'] || 'Unnamed'}": ${err.message}`);
      }
    }

    return results;
  }
}
