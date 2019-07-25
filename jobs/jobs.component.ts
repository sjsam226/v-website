import { Component, OnInit } from '@angular/core';
/* import { A2AService } from '../services/A2A/a2-a.service'; */

@Component({
  selector: 'app-jobs',
  templateUrl: './jobs.component.html',
  styleUrls: ['./jobs.component.css']
})
export class JobsComponent implements OnInit {
  /* trendingQuestion: any[]; */

  constructor(
    /* private a2aServ: A2AService */
  ) { }

  ngOnInit() {
  }

  // get trending questions
  /* trendingQst() {
    this.a2aServ.trendingQuestion()
      .subscribe((data: any) => {
        this.trendingQuestion = data;
      }, (error) => {
        console.log(error.message);
      });
  } */
  // end get trending questions

  ngOnDestroy() {
    /* this.trendingQuestion = null; */
  }

}
