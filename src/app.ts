import dotenv from "dotenv";
import { createWorker, types } from "mediasoup";
import express, { Application } from "express";
import bodyParser from "body-parser";

const env_result = dotenv.config();
console.log(`Loading env_result: ${env_result.parsed}`);

// keeping worker in array
let mediasoupWorkers: types.Worker[] = [];
// keeping in global express app
let expressApp: Application;
// keep rooms in memory
const rooms = new Map<Number, any>();

async function runSoupWorkers() {
	const numWorkers = Number(process.env.WORKER_NUMBERS) | 4;

	console.log("running %d mediasoup Workers...", numWorkers);

	for (let i = 0; i < numWorkers; i++) {
		const worker = await createWorker({
			logLevel: "debug",
			logTags: ["info"],
			rtcMinPort: 10000,
			rtcMaxPort: 59999,
		});

		worker.on("died", () => {
			console.error(
				"mediasoup Worker died, exiting in 2 seconds... [pid:%d]",
				worker.pid
			);

			setTimeout(() => process.exit(1), 2000);
		});
		mediasoupWorkers.push(worker);

		// log worker resource usage every X seconds.

		setInterval(async () => {
			const usage = await worker.getResourceUsage();

			console.info(
				"mediasoup Worker resource usage [pid:%d]: %o",
				worker.pid,
				usage
			);
		}, 120000);
	}
}

async function createExpressApp() {
	console.info("creating Express app...");

	expressApp = express();

	expressApp.use(bodyParser.json());

	// For every API request, verify that the roomId in the path matches and exists
	expressApp.param("roomId", (req, res, next, roomId) => {
		if (!rooms.has(roomId)) {
			throw new Error(`room with id "${roomId}" not found`);
		}

		req.room = rooms.get(roomId);

		next();
	});

	// API GET resource that returns the mediasoup Router RTP capabilities of the room
	// expressApp.get("/rooms/:roomId", (req, res) => {
	// 	const data = req.room.get;
	// });
}

async function run() {
	console.log("Creating soup worker");
	// await createWorker();
	await runSoupWorkers();
	await createExpressApp();
}

run();
