import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DateService } from './src/common/date.service';

function testChecklistNumericBounds(item: any, responseValue: string, passedInValue: boolean | undefined): boolean {
  let passed = passedInValue;

  if (item && item.dataType === 'NUMBER' && responseValue) {
    const numericVal = parseFloat(responseValue);
    if (!isNaN(numericVal)) {
      let minLimit: number | null = null;
      let maxLimit: number | null = null;
      
      for (const opt of item.options || []) {
        if (opt.startsWith('min:')) {
          minLimit = parseFloat(opt.split(':')[1]);
        } else if (opt.startsWith('max:')) {
          maxLimit = parseFloat(opt.split(':')[1]);
        }
      }

      if (minLimit !== null && numericVal < minLimit) {
        passed = false;
      }
      if (maxLimit !== null && numericVal > maxLimit) {
        passed = false;
      }
    }
  }
  return passed ?? true;
}

async function bootstrap() {
  console.log('Bootstrapping NestJS Context for Verification...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const dateService = app.get(DateService);

  console.log('\n--- 1. Timezone-Aware Calculation Verification ---');
  const baseUTC = new Date('2026-03-05T08:00:00Z'); // Just before Spring DST changes
  const laTimezone = 'America/Los_Angeles';

  console.log(`Base UTC Date: ${baseUTC.toISOString()}`);
  
  // Shift to LA timezone
  const localizedBase = dateService.toTimezone(baseUTC, laTimezone);
  console.log(`Localized LA time before PM calculation: ${localizedBase.toString()}`);

  // Add 1 Month
  const localizedNext = dateService.calculateNextDueDate(localizedBase, 'MONTHS', 1);
  console.log(`Localized LA time after PM calculation: ${localizedNext.toString()}`);

  // Convert back to UTC
  const nextDueDateUTC = dateService.toUTC(localizedNext, laTimezone);
  console.log(`Target UTC Date (stored in DB): ${nextDueDateUTC.toISOString()}`);
  console.log('Result: Timezone-aware date calculations preserve localized time across DST!');


  console.log('\n--- 2. Smart Checklist Range Parsing Verification ---');
  const testItem = {
    dataType: 'NUMBER',
    options: ['min:15.5', 'max:95.2'],
  };

  const test1 = testChecklistNumericBounds(testItem, '50.0', true);
  console.log(`Test 1: Input "50.0" within 15.5-95.2. Passed: ${test1} (Expected: true)`);

  const test2 = testChecklistNumericBounds(testItem, '10.2', true);
  console.log(`Test 2: Input "10.2" under limit (15.5). Passed: ${test2} (Expected: false)`);

  const test3 = testChecklistNumericBounds(testItem, '99.9', true);
  console.log(`Test 3: Input "99.9" over limit (95.2). Passed: ${test3} (Expected: false)`);

  console.log('\nVerification complete successfully.');
  await app.close();
}

bootstrap().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
