import { EventEmitter } from "events";
import protoo from "protoo-server";
import { types } from "mediasoup";

type RoomCreateArgumentType = {
	mediasoupWorker: types.Worker;
	roomId: number;
};

type RoomConstructorArgumentType = {
	roomId: number;
	protooRoom: protoo.Room;
	mediasoupRouter: types.Router;
	audioLevelObserver: types.AudioLevelObserver;
	// TODO: bot???
};

export class Room extends EventEmitter {
	private _roomId: number;
	private _closed: boolean;
	private _protooRoom: protoo.Room;
	private _broadcasters: Map<String, Object>; //TODO: Broadcaster has more extensive type
	private _mediasoupRouter: types.Router;
	private _audioLevelObserver: types.AudioLevelObserver;
	private _networkThrottled: boolean;

	static async create({ mediasoupWorker, roomId }: RoomCreateArgumentType) {
		console.log("create() [roomId:%s]", roomId);

		// create protoo Room instance
		const protooRoom = new protoo.Room();

		// create mediasoup Router
		const mediasoupRouter = await mediasoupWorker.createRouter({
			mediaCodecs: [
				{
					kind: "audio",
					mimeType: "audio/opus",
					clockRate: 48000,
					channels: 2,
				},
				{
					kind: "video",
					mimeType: "video/VP8",
					clockRate: 90000,
					parameters: {
						"x-google-start-bitrate": 1000,
					},
				},
			],
		});

		// create a mediasoup AudioLevelObserver
		const audioLevelObserver =
			await mediasoupRouter.createAudioLevelObserver({
				maxEntries: 1,
				threshold: -80,
				interval: 800,
			});

		return new Room({
			roomId,
			protooRoom,
			mediasoupRouter,
			audioLevelObserver,
		});
	}

	private constructor({
		roomId,
		protooRoom,
		mediasoupRouter,
		audioLevelObserver,
	}: RoomConstructorArgumentType) {
		super();
		this.setMaxListeners(Infinity);

		this._roomId = roomId;

		this._closed = false;

		this._protooRoom = protooRoom;

		this._broadcasters = new Map();

		this._mediasoupRouter = mediasoupRouter;

		this._audioLevelObserver = audioLevelObserver;

		this._networkThrottled = false;

		// TODO: handleAudioLevelObserver function call (private)

		// TODO: attaching to global for debugging
	}
}
