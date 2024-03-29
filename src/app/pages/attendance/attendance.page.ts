import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { AuthService } from 'src/app/services/auth.service';
import * as moment from 'moment';
import { UtilService } from 'src/app/services/util.service';

@Component({
  selector: 'app-attendance',
  templateUrl: './attendance.page.html',
  styleUrls: ['./attendance.page.scss'],
})
export class AttendancePage implements OnInit {

  isLogging: any = false;
  isLoading: any = true;
  myInterval = null;
  previous = null;
  attendance: any[] = [];

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private util: UtilService
  ) {
    this.getMyClockedList();
  }

  getMyClockedList() {
    this.isLoading = true;
    this.api.posts('attendance/my_clocked_in_list', {}).then((response: any) => {
      this.serverDatetime = new Date(response.status.local_time);

      if(response.success) {

        if(this.myInterval) {
          clearInterval(this.myInterval);
        }

        this.myInterval = setInterval(() => {
          this.serverDatetime.setSeconds(this.serverDatetime.getSeconds() + 1);
        }, 1000);

        if(response.status.clocked_in) {
          this.clockedinDatetime = new Date(response.status.clocked_in); //Issue
        } else {
          this.clockedinDatetime = null;
        }

        this.previous = null;
        this.attendance = [];
        const clockedIn: any[] = response.data;
        clockedIn.forEach(attd => {
          this.attendance.push(
            {
              id: attd.id,
              timein: attd.in_time,
              timeout: attd.out_time,
              duration: attd.duration
            }
          );
        });

      } else {
        this.util.modalAlert(
          'Something went wrong',
          this.serverDatetime.toLocaleTimeString(),
          'The server did not respond accordingly.'
        );
      }
    }).catch(error => {
      this.util.modalAlert('Error', 'Something went wrong!');
      console.log('error', error);
    }).finally(() => {
      this.isLoading = false;
    });
  }

  public get isClockedIn(): any {
    return this.clockedinDatetime ? true:false;
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  private serverDatetime: Date = new Date();
  public get currentDate(): any {
    return this.serverDatetime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
  public get currentTime(): any {
    return this.serverDatetime.toLocaleTimeString();
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  private clockedinDatetime: Date = new Date();
  public get currentDatestart(): any {
    return 'Started'+moment(this.clockedinDatetime).format(' on h:mm:ss A of Do MMMM YYYY');
  }
  public get currentTimespan(): any {
    const start = moment(this.clockedinDatetime);
    const end = moment(this.serverDatetime);
    const duration = moment.duration(end.diff(start));
    // eslint-disable-next-line max-len
    return Math.floor(duration.asHours())+'h '
      +Math.floor(duration.asMinutes() % 60)+'m '
      +Math.floor(duration.asSeconds() % 60)+'s';
  }

  ngOnInit() {
  }

  logTime() {
    this.isLogging = true;

    const userId = this.auth.userToken.id;
    this.api.posts('attendance/logtime', {
      self: this.auth.userToken.uuid
    }).then(async (res: any) => {

      if(res.success === false) {
        this.util.modalAlert('Action not Allowed', res.message);
        await this.sleep(3000);
        return;
      }

      this.util.playAudio();
      const premsg = res.clocked ? 'Goodbye! ' : 'Welcome! ';
      this.util.modalAlert(premsg, res.stamp, this.auth.currentUser.first_name +' '+ this.auth.currentUser.last_name);

      this.getMyClockedList();
      await this.sleep(3000);
    }).catch(error => {
      this.util.modalAlert('Error', 'Something went wrong!');
      console.log('error', error);
    }).finally(() => {
      this.isLogging = false;
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
