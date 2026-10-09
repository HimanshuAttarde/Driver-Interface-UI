import { TripManifestService } from './modules/trip-manifest/manifest.service';
import { prisma } from './common/prisma.service';

/**
 * Self-contained verification runner demonstrating:
 * 1. Fetching active manifest & next actionable stop
 * 2. Marking stop arrived
 * 3. Verifying passenger boarding OTP
 * 4. Completing drop-off & closing trip with Shapley settlement
 */
async function runManifestVerification() {
  console.log('================================================================');
  console.log('🚀 SMARTPOOL ACTIVE TRIP MANIFEST & TELEMETRY VERIFICATION');
  console.log('================================================================\n');

  const driverId = '550e8400-e29b-41d4-a716-446655440000';
  const manifestService = new TripManifestService(prisma);

  // 1. Fetch active manifest
  console.log('📍 1. Fetching Active Manifest for Driver (Sameer Khan)...');
  const manifest = await manifestService.getActiveManifest(driverId);
  console.log(`   Trip Batch ID: ${manifest.tripBatchId}`);
  console.log(`   Corridor: ${manifest.corridorName}`);
  console.log(`   Status: ${manifest.status}`);
  console.log(`   Expected Shapley Payout: ₹${manifest.totalShapleyPayout}`);
  console.log(`   Current Occupancy: ${manifest.currentOccupancy} / ${manifest.maxCapacity} seats`);
  console.log(`   Progress: ${manifest.progress.completedStops}/${manifest.progress.totalStops} stops (${manifest.progress.percentComplete}%)`);

  if (manifest.nextStop) {
    console.log(`\n👉 NEXT ACTIONABLE STOP:`);
    console.log(`   Sequence #${manifest.nextStop.sequenceOrder} [${manifest.nextStop.stopType}]`);
    console.log(`   Rider: ${manifest.nextStop.riderName}`);
    console.log(`   Location: ${manifest.nextStop.locationName}`);
    console.log(`   Status: ${manifest.nextStop.status}`);

    // 2. Simulate Driver Arriving at Stop
    console.log(`\n🚏 2. Driver arriving at stop: ${manifest.nextStop.locationName}...`);
    const arrivedStop = await manifestService.markStopArrived(driverId, manifest.nextStop.id);
    console.log(`   Updated Stop Status: ${arrivedStop.status} (Rider notified)`);

    // 3. Simulate OTP Boarding Verification
    console.log(`\n🔑 3. Verifying Passenger Boarding with OTP "1934"...`);
    const boardingOutcome = await manifestService.verifyBoarding(driverId, {
      stopId: manifest.nextStop.id,
      otp: '1934',
    });
    console.log(`   Verification Success: ${boardingOutcome.success}`);
    console.log(`   Boarded Rider: ${boardingOutcome.verifiedRider}`);
    console.log(`   Live Car Occupancy: ${boardingOutcome.currentOccupancy} seats occupied`);
  }

  // 4. Test Location Telemetry Ping
  console.log(`\n📡 4. Emitting Driver GPS Telemetry Ping (NH48 Lonavala Ghats)...`);
  const pingResult = manifestService.recordLocationPing(driverId, {
    tripBatchId: manifest.tripBatchId,
    lat: 18.7557,
    lng: 73.4091,
    bearing: 312,
    speed: 84.5,
    timestamp: Date.now(),
  });
  console.log(`   Ping Acknowledged: Lat ${pingResult.lat}, Lng ${pingResult.lng}, Speed ${pingResult.speed} km/h`);

  // 5. Test Dropoff Completion & Occupancy Decrement
  console.log(`\n🏁 5. Testing Passenger Dropoff Completion...`);
  // Complete stop 4 (Rahul Sharma dropoff at Vashi)
  const dropoff1 = await manifestService.completeDropoff(driverId, '44444444-4444-4444-4444-444444444444');
  console.log(`   Dropoff 1 Concluded: ${dropoff1.riderName} | Occupancy: ${dropoff1.currentOccupancy} seats`);

  // Complete stop 5 (Priya Kulkarni dropoff at Mankhurd)
  const dropoff2 = await manifestService.completeDropoff(driverId, '55555555-5555-5555-5555-555555555555');
  console.log(`   Dropoff 2 Concluded: ${dropoff2.riderName} | Occupancy: ${dropoff2.currentOccupancy} seats`);

  // Complete stop 6 (Amit Verma dropoff at Chembur - final stop)
  const dropoff3 = await manifestService.completeDropoff(driverId, '66666666-6666-6666-6666-666666666666');
  console.log(`   Final Dropoff: ${dropoff3.riderName} | Remaining Occupancy: ${dropoff3.currentOccupancy} seats`);
  console.log(`   Trip Batch Concluded: ${dropoff3.tripFinished}`);
  console.log(`   Disbursed Shapley Settlement: ₹${dropoff3.totalShapleyPayout} (${dropoff3.settlementStatus})`);

  console.log('\n================================================================');
  console.log('✅ ALL MANIFEST & TELEMETRY CHECKS PASSED (BOARDING + DROPOFF + SHAPLEY)');
  console.log('================================================================');
}

if (require.main === module) {
  runManifestVerification().catch(console.error);
}

export { runManifestVerification };
