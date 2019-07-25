import { Component, OnInit } from '@angular/core';
// import { AuthenticationService } from '@/services';
import { A2AService } from '../../services/A2A/a2-a.service';
import { TopicService } from '../../services/topic/topic.service';
import { UserService } from '../../services/user/user.service';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as $ from 'jquery';
import { NotifierService } from 'angular-notifier';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import { SharedService } from '../../services/shared/shared.service';
import { Buffer } from 'buffer';
import swal from 'sweetalert2';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {
  message: string;
  text: string;
  limit: number = 220;
  // currentUser: User;
  // userFromApi: User;
  private user: any;
  public editor: any;
  public newAnswerData: any;
  userRedFlag: FormGroup;
  qstList: any[];
  pageNo: number;
  public isLoggedIn = false;
  public answers;
  ansList: any[];
  answerData: any;
  trendingQuestion: any[];
  topicList: any[];
  answer = '';
  ans: any;
  reset = '';
  ansData: any;
  commentData: any;
  replyData: any;
  error: any;
  public loadComponent: any;
  answerId: any;
  public loadMore = false;
  // public searchedData:any;
  private likeResult: any;
  private qstFollowResult: any;
  private redFlagResult: any;
  private QuestionData: any;
  public expertNotAssigned: boolean = false;
  private isCA = false;
  public role: any;
  dataRefresher: any;
  private userId: string;

  private readonly notifier: NotifierService;

  constructor(
    private a2aServ: A2AService,
    private topicServ: TopicService,
    notifierService: NotifierService,
    private router: Router,
    private userServ: UserService,
    private sanitizer: DomSanitizer,
    private shared: SharedService
  ) {
    // this.currentUser = this.authenticationService.currentUserValue;
    this.notifier = notifierService;
    this.shared.nonTitleRoutes('Verwin');
    this.shared.newAnswer.subscribe((data) => {
      this.newAnswerData = JSON.parse(data);
      this.addAnswer();
    })
  }

  ngOnInit() {
    this.shared.pushQuestionData.subscribe((questionData) => {
      if (questionData !== null) {
        this.QuestionData = JSON.parse(questionData);
        this.qstList.unshift(this.QuestionData);
      }
    });
    this.shared.currentMessage.subscribe((message) => {
      this.isLoggedIn = message;
      if (message === false) {
        this.logoutFollowed();
        this.logoutLiked();
        this.likeResult = null;
        this.qstFollowResult = null;
        this.redFlagResult = null;
      } else {
        this.loggedUserAct();
        this.actionInject();
      }
    });
    if (this.pageNo === undefined) {
      this.pageNo = 1;
    }
    this.shared.currentUserRole.subscribe((role) => {
      this.role = role;
      if (role === 'expert') {
        this.qstList = null;
        this.pageNo = 1;
        this.ifExpert();
      } else {
        this.qstList = null;
        this.pageNo = 1;
        this.nonExpert();
      }
    });
    this.shared.currentUserId.subscribe((userId) => {
      this.userId = userId;
      this.shared.currentUserParam.subscribe((userParam) => {
        this.user = `${userParam}.${window.btoa(userParam)}.${userId}.${window.btoa(userId)}`;
      });
    })
    if (this.role === 'contentAdmin') {
      this.isCA = true;
    }
    // this.getQstList();
    this.onScrollDown();
    this.getTopic();
    this.trendingQst();
    this.actionInject();
  }
  // add answer
  addAnswer() {
    if (this.newAnswerData) {
      this.changeDescForAnswers(this.newAnswerData.questionId, this.newAnswerData);
    }
  }
  // end add answer
  // show more
  showMoreToggle(QstDetail) {
    this.a2aServ.individualAnswer(QstDetail.answerId)
      .subscribe((data: any) => {
        for (var i in this.qstList) {
          if (this.qstList[i].questionId === QstDetail.questionId) {
            this.qstList[i].answer = data.answer;
            Object.assign(this.qstList[i], { show: 'more' });
            if (QstDetail.answerVideo) {
              delete this.qstList[i]['answerVideo'];
            } else if (QstDetail.answerImage) {
              delete this.qstList[i]['answerImage'];
            }
          }
        }
      }, (error) => {
        console.log(error)
      })

  }
  // end show more
  // show less
  showLessToggle(QstDetail) {
    for (var i in this.qstList) {
      if (this.qstList[i].questionId === QstDetail.questionId) {
        var result = delete this.qstList[i]['show'];
      }
    }
  }
  // end show less
  // switch to topic page
  navigateToTopicPage(topic) {
    const topicParam = topic.split(' ').join('-');
    this.router.navigate(['/a2a/topic/', topicParam]);
  }
  // end switch to topic page
  // switch to user page
  navigateToUserPage(userName) {
    const userParam = userName.split(' ').join('-');
    this.router.navigate(['/a2a/', userParam]);
  }
  // end switch to user page
  // switch to question page
  navigateToQstPage(QstDetail) {
    window.open(`${location.origin}/${QstDetail.questionParam}`);
  }
  // end switch to question page
  // get user actions data after login
  loggedUserAct() {
    setTimeout(() => {
      this.userServ.userActions(this.userId)
        .subscribe((resData: any) => {
          let bufferOriginal = Buffer.from(resData.data);
          const data = bufferOriginal.toString('utf8');
          const userActions = JSON.parse(data);
          this.likeResult = userActions.likeResult;
          this.qstFollowResult = userActions.qstFollowResult;
          this.redFlagResult = userActions.redFlagResult;
        }, (error) => {
          console.log(error);
        });
    }, 1000);
  }
  // end get user actions data after login
 
  // sharing to socialmedia
  shareOnFB(QstDetail) {
    const question = QstDetail.question.replace(/\?/gi, " ");
    const url = `https://www.facebook.com/sharer/sharer.php?u=https://verwin-server-api.herokuapp.com/api/a2a/q2a/meta/${QstDetail.questionId}`;
    window.open(url, '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=300,width=600');
    return false;
  }
  shareOntwitter(QstDetail) {
    const url = `https://twitter.com/intent/tweet?url=https://verwin-server-api.herokuapp.com/api/a2a/q2a/meta/${QstDetail.questionId}&text=Question on @VerwinCareers : ${QstDetail.question}`;
    window.open(url, 'TwitterWindow', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=300,width=600');
    return false;
  }
  shareOnLinkedIn(QstDetail) {
    const url = `https://www.linkedin.com/shareArticle?mini=true&url=https://verwin-server-api.herokuapp.com/api/a2a/q2a/meta/${QstDetail.questionId}`;
    window.open(url, 'TwitterWindow', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=300,width=600');
    return false;
  }
  whatsappShare(QstDetail) {
    const url = `https://web.whatsapp.com/send?text=https://verwin-server-api.herokuapp.com/api/a2a/q2a/meta/{{QstDetail.questionId}}`;
    window.open(url, 'whatsappWindow', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=300,width=600');
    return false;
  }
  // copy link
  copyMessage(QstDetail: any) {
    const url = `https://verwin-server-api.herokuapp.com/api/a2a/q2a/meta/${QstDetail.questionId}`;
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = url;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
    this.notifier.show({
      type: 'default',
      message: 'Link copied!',
    });
  }
  // end sharing to socialmedia
  // indicate when user follow the question
  changeDescForFollow(questionId) {
    for (var i in this.qstList) {
      if (this.qstList[i].questionId == questionId) {
        this.qstList[i].followCount = this.qstList[i].followCount + 1;
        var result = Object.assign(this.qstList[i], { followed: true })
        break;
      }
    }
  }
  // end indicate when user follow the question
  // indicate when user likes the answer

  changeDescForLikes(questionId) {
    for (var i in this.qstList) {
      if (this.qstList[i].questionId === questionId) {
        this.qstList[i].likes = this.qstList[i].likes + 1;
        var result = Object.assign(this.qstList[i], { liked: true })
        break;
      }
    }
  }
  // end indicate when user likes the answer
  // indicate when user comment the answer

  changeDescForComments(questionId) {
    for (var i in this.qstList) {
      if (this.qstList[i].questionId === questionId) {
        this.qstList[i].commentsCount = this.qstList[i].commentsCount + 1;
        break;
      }
    }
  }
  // end indicate when user comment the answer
  // add answer when user answered for the question

  changeDescForAnswers(questionId, answerData) {
    for (var i in this.qstList) {
      if (this.qstList[i].questionId === questionId) {
        this.qstList[i].answer = answerData.answer;
        this.qstList[i].answerId = answerData.answerId;
        this.qstList[i].answeredAt = answerData.createdAt;
        this.qstList[i].answerProfileImg = answerData.profileImg;
        this.qstList[i].answerRole = answerData.role;
        this.qstList[i].answeredByName = answerData.userName;
        this.qstList[i].answeredByUserId = answerData.userId;
        this.qstList[i].answerImage = '';
        this.qstList[i].answerVideo = ''; 
        Object.assign(this.qstList[i], { show: 'more' });
        if (answerData.role === 'expert') {
          this.qstList[i].expertAnswered = true;
        } else {
          this.qstList[i].expertAnswered = false;
        }
        this.qstList[i].commentsCount = 0;
        this.qstList[i].likes = 0;
        this.qstList[i].answerCount = this.qstList[i].answerCount + 1;
        this.newAnswerData = null;
        break;
      }
    }
  }
  // end add answer when user answered for the question
  // indicate liked answer
  liked(answerId) {
    for (var j in this.qstList) {
      if (this.qstList[j].answerId === answerId) {
        var result = Object.assign(this.qstList[j], { liked: true })
      }
    }
  }
  // end indicate liked answer
  // clear likes after logged out
  logoutLiked() {
    for (var j in this.qstList) {
      var result = Object.assign(this.qstList[j], { liked: false })
    }
  }
  // end clear likes after logged out
  // indication of follow the question

  followed(questionId) {
    for (var j in this.qstList) {
      if (this.qstList[j].questionId == questionId) {
        var result = Object.assign(this.qstList[j], { followed: true })
      }
    }
  }
  // end indication of follow the question
  // clear indication of follow the question after loggout

  logoutFollowed() {
    for (var j in this.qstList) {
      var result = Object.assign(this.qstList[j], { followed: false })
    }
  }
  // end clear indication of follow the question after loggout

  // indicate the liked, followed after login
  actionInject() {
    setTimeout(() => {
      for (var i in this.likeResult) {
        this.liked(this.likeResult[i].answerId);
      };
      for (var i in this.qstFollowResult) {
        this.followed(this.qstFollowResult[i].questionId);
      }
    }, 3000);
  }
  // end indicate the liked, followed after login
  // load assigned questions if expert login 
  ifExpert() {
    if (this.userId) {
      this.userServ.getUserQst(this.userId, this.pageNo)
        .subscribe((data: any) => {
          if (!this.qstList) {
            this.qstList = data.qstResult;
            this.pageNo = data.page;
            this.actionInject();
            if (!data.qstResult && this.role === 'expert') {
              this.expertNotAssigned = true;
            }
          } else {
            if (this.pageNo !== data.page) {
              this.qstList.push(...data.qstResult);
              this.pageNo = data.page;
            }
            this.actionInject();
          }
        }, (error) => {
          console.log(error.message);
        });
    }
  }
  // end load assigned questions if expert login 
  // load all recent questions for user
  nonExpert() {
    this.a2aServ.displayQst(this.pageNo)
      .subscribe(async (data: any) => {
        if (!this.qstList) {
          let bufferOriginal = Buffer.from(data.qstResult.data);
          this.qstList = JSON.parse(bufferOriginal.toString('utf8'));
          this.pageNo = data.page;
          this.actionInject();
        } else {
          if (this.pageNo !== data.page) {
            let bufferOriginal = Buffer.from(data.qstResult.data);
            await this.qstList.push(...JSON.parse(bufferOriginal.toString('utf8')));
            this.pageNo = data.page;
          }
          this.actionInject();
        }
      }, (error) => {
        console.log(error);
      });
  }
  // end load all recent questions for user
  // onscroll load questions 
  onScrollDown() {
    if (this.role !== 'expert') {
      this.nonExpert();
    } else {
      this.ifExpert();
    }
  }
  // end onscroll load questions 
  // future
  onScrollUp() {
    console.log('scrolled up!!');
  }
  // end future
  // login popup if user not loggedin
  onclickLogin() {
    if (this.isLoggedIn === false) {
      this.shared.toggleloginPopUp(false);
    }
  }
  // end login popup if user not loggedin
  // toggle the answer, comment and share collapses
  toggleAction(action, QstDetail) {
    if (action === 'answer') {
      this.shared.getQuestionId(QstDetail.questionId);
      $(`#${QstDetail.questionId}`).toggle('collapse');
      $(`#${QstDetail.questionId}-1`).hide();
      $(`#${QstDetail.questionId}-2`).hide();
      this.editor = QstDetail.questionId;
      if (this.loadComponent === true) {
        this.loadComponent = false;
      } else {
        this.loadComponent = true;
      }
    }
    if (action === 'comment') {
      $(`#${QstDetail.questionId}`).hide();
      $(`#${QstDetail.questionId}-1`).toggle('collapse');
      $(`#${QstDetail.questionId}-2`).hide();
    }
    if (action === 'share') {
      $(`#${QstDetail.questionId}-2`).toggle('collapse');
      $(`#${QstDetail.questionId}`).hide();
      $(`#${QstDetail.questionId}-1`).hide();
    }
  }
  // end toggle the answer, comment and share collapses
  // user like 
  like(QstDetail) {
    if (!this.userId) {
      return this.shared.toggleloginPopUp(false);
    }
    this.a2aServ.likes(this.userId, QstDetail)
      .subscribe((data: any) => {
        this.changeDescForLikes(QstDetail.questionId);
        this.notifier.show({
          type: 'default',
          message: `${data}`,
        });
      }, (error) => {
        if (error) {
          this.notifier.show({
            type: 'default',
            message: `${error}`,
          });
        }
      });
  }
  // end user like
  // user follows to the question
  follow(detail) {
    if (!this.userId) {
      return this.shared.toggleloginPopUp(false);
    }
    this.a2aServ.follow(this.userId, detail)
      .subscribe((data) => {
        this.changeDescForFollow(detail.questionId);
        // this.a2aServ.qstAndAnws(detail.questionId)
        //   .subscribe((resData: any) => {
        //     const followCount = resData.questionResult.followCount;
        //     const questionIdActivity = resData.questionResult.questionId;
            
        //   }, (error) => {
        //     console.log(error);
        //   });
        this.notifier.show({
          type: 'default',
          message: `${data}`
        });
      }, (error) => {
        this.notifier.show({
          type: 'default',
          message: `${error.error.message}`
        });
      });
  }
  // end user follows to the question

  // future use
  unFollow(QstDetail) {
    console.log(QstDetail);
  }
  // future use
  questionNewTab(QstDetail) {
    const url = `https://www.verwin.com/${QstDetail.question.replace(/[&\/\\#,+()$~%.'":*?<>{}]/gi, "_").split(' ').join('-')}/${QstDetail._source.questionId}`;
    window.open(url, '_blank');
  }
  // comment for the question
  comment(commentForm, QstDetail) {
    if (!this.userId) {
      this.shared.toggleloginPopUp(false);

    }
    const user = { userId: this.userId };
    const questionId = { questionId: QstDetail.questionId };
    const answerId = { answerId: QstDetail.answerId };
    const comment = commentForm.value;
    const result = Object.assign({}, questionId, answerId, user, comment);
    this.a2aServ.addComment(result)
      .subscribe((data) => {
        commentForm.reset();
        this.a2aServ.comments(QstDetail.answerId)
          .subscribe(
            (resData: any) => {
              this.commentData = resData.commentResult;
              // $(`#${QstDetail.questionId}-1`).hide();
              this.changeDescForComments(QstDetail.questionId);
            }, (error) => {
              console.log(error);
            }
          );
      }, (error) => {
        console.log(error);
      });
  }
  // end comment for the question
  // reply for the comment
  reply(replyForm, comments) {
    if (!this.userId) {
      this.shared.toggleloginPopUp(false);
    }
    const user = { userId: this.userId };
    const questionId = { questionId: comments.questionId };
    const answerId = { answerId: comments.answerId };
    const commentId = { commentId: comments.commentId };
    const reply = replyForm.value;
    const result = Object.assign({}, questionId, answerId, user, reply, commentId);
    this.a2aServ.addReply(result)
      .subscribe((data) => {
        replyForm.reset();
        this.a2aServ.reply(comments.commentId)
          .subscribe(
            (resData: any) => {
              this.replyData = resData.replyResult;
              // $(`#${comments.commentId}-1`).hide();
            }, (error) => {
              console.log(error);
            }
          );
      }, (error) => {
        console.log(error);
      });
  }
  // end reply for the comment
  // get topic from teh global
  getTopic() {
    this.shared.currenttopics.subscribe((topicData) => {
      this.topicList = JSON.parse(topicData);
    });
  }
  // end get topic from teh global
  // get trending questions
  trendingQst() {
    this.a2aServ.trendingQuestion()
      .subscribe((data: any) => {
        this.trendingQuestion = data;
      }, (error) => {
        console.log(error.message);
      });
  }
  // end get trending questions
  // answer for the questions
  Answer(questionId) {
    if (!this.userId) {
      this.shared.toggleloginPopUp(false);
    }
    const reqData = Object.assign({}, { answer: this.answer }, { questionId: questionId }, { userId: this.userId });
    this.a2aServ.answerAQuestion(reqData)
      .subscribe((data: any) => {
        this.answer = null;
        const questionIdResult = data.questionId;
        this.changeDescForAnswers(questionIdResult, data);
        $(`#${questionId}`).hide();
      }, (error) => {
        console.log(error.message);
      });
  }
  // end answer for the questions
  // get comments for the answers
  getComment(answerId) {
    this.onclickLogin();
    this.a2aServ.comments(answerId)
      .subscribe(
        (resData: any) => {
          this.commentData = resData.commentResult;
        }, (error) => {
          console.log(error);
        }
      );
  }
  // end get comments for the answers
  // get reply for the comments
  getReply(commentId) {
    this.a2aServ.reply(commentId)
      .subscribe(
        (resData: any) => {
          this.replyData = resData.replyResult;
        }, (error) => {
          console.log(error);
        }
      );
  }
  // end get comments for the answers
  // redflag for the answers
  redFlag(redFlagForm, answerId) {
    if (!this.userId) {
      this.shared.toggleloginPopUp(false);
    }
    $(`#${answerId}`).hide();
    $('.modal-backdrop').remove();
    $('body').removeClass('modal-open');
    const result = Object.assign({}, redFlagForm.value, { answerId: answerId });
    this.a2aServ.redFlag(this.userId, result)
      .subscribe((data) => {
        this.notifier.show({
          type: 'default',
          message: `${data}`,
        });
      },
        (error) => {
          this.notifier.show({
            type: 'default',
            message: `${error}`,
          });
        });
  }
  // end redflag for the answers

  ngOnDestroy() {
    this.qstList = null;
    this.ansList = null;
    this.QuestionData = null;
    this.topicList = null;
    this.pageNo = null;
    this.trendingQuestion = null;
  }

}

