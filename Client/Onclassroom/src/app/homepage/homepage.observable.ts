import { Subject } from 'rxjs';

export class homepageObservable {
    private setnotification = new Subject<string>();

    notification$ = this.setnotification.asObservable();

    set notification(data){
        this.setnotification.next(data);
    }

}
