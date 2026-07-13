import { BehaviorSubject } from 'rxjs';


const onCargoUpdate$ = new BehaviorSubject('');
export const onCargoUpdate = onCargoUpdate$.asObservable();

const onCargoCreate$ = new BehaviorSubject('');
export const onCargoCreate = onCargoCreate$.asObservable();

const websocket = new WebSocket('wss://n7w79iw8p7.execute-api.us-east-1.amazonaws.com/dev/');
websocket.onopen = () => 
        console.log('Connected to WebSocket server');
      websocket.onmessage = (event) => {
        console.log('Message received ' + event.data);
        if ('INSERT CargoUnits' === event.data) {
          onCargoCreate$.next(event.data)
        } else if ('MODIFY CargoUnits' === event.data) {
          onCargoUpdate$.next(event.data)
        }

      };
      websocket.onclose = () => 
        console.log('Disconnected from WebSocket server');

export const sendMessage = (msg: string) => {
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(msg);
      }
    };
export const closeRealTimeCall = () =>{
      websocket.close();

}



