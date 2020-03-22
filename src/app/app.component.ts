import {AfterViewInit, Component, ElementRef, NgZone, OnInit, ViewChild} from '@angular/core';
declare let ml5: any;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  // Variable d'extraction de carasteristique du reseau CNN mobilenet
  public mobileNetFeatureExtractor;
  // Varaible classifieur de carasteristique
  public featureClassifier;
  // Variable label
  public label;
  // Variable de confidence
  public confidence;
  // Variable nouveau label
  public newLabel;
  // Variable bar de progression
  public currentProgress = 0;
  // Variable fonction de perte
  public loss: number;
  // Variable nombre d'iteration
  public iteration: number;

  // Variable static pour l'element de reference de notre capteur ou source d'images
  @ViewChild('video', { static: true })  public video: ElementRef;
  // Variable static pour l'element de reference minature
  @ViewChild('canvas', { static: true })  public canvas: ElementRef;
  // variable tableau capture qui capture tous les images fournies en minature ou les videos
  public captures: Array<any>;

  // Constructeur avec initialisation du tableau de minature a vide
  // Ce constructeur prend en parametre un contexte dexecution sur les mises ajour entre le composant et la page HTML
  constructor(private zone: NgZone) {
    this.captures = [];
  }

  // la methode ngOnInit() qui cree notre reseau CNN d'extraction de carasteristique mobilenet
  // il cree aussi notre classifieur qui classifie en entree les images venant de la camera
  ngOnInit(): void {
     this.mobileNetFeatureExtractor = ml5.featureExtractor('MobileNet', () => {
      this.featureClassifier = this.mobileNetFeatureExtractor.classification(this.video.nativeElement, () => {
        console.log('Vidéo ready');
      });
    });
  }

  // la methode addImage du classifieur de carasteristique qui prend comme parametre le label ou cible
  // activation de la capture des flux d'images venant de la camera
  addImage() {
    this.featureClassifier.addImage(this.newLabel);
    this.capture();
  }

  // Entrainement du modele featurembilenetextraction
  train() {
    // initialisation du nombre d'iteration à 0 et aussi de la variable de fonction de perte a 0
    this.iteration = 0; this.loss = 0;
    // Initialisation de la barre de progression à 0
    this.currentProgress = 0;
    // la methode train() qui prend en parametre la fonction de perte qui est null
    this.featureClassifier.train((loss) => {
      // si la valeur de la fonction de perte est null
      if (loss == null) {
        // Nombre d'iteration fixé à 100
        this.iteration = 100;
        // On classifie les nos features et affiche les resultats
        this.mobileNetFeatureExtractor.classify((e, r) => {
          this.gotResults(e, r);
        });
      }
      // sinon on execute notre zone
        // on incremente la barre de progression
        // ainsi que le nombre d'iteration
        // et aussi la fonction de perte
      else {
        this.zone.run(() => {
          ++this.currentProgress;

          ++this.iteration;
          this.loss = loss;
        });
      }
    });
  }
  // taches d'initialisations supplementaires
  public ngAfterViewInit() {
    console.log(webkitURL);
    if ( navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        this.video.nativeElement.srcObject = stream;
        this.video.nativeElement.play();
      });
    }
  }
// Methode d'activation de la camera et extracttraction de l'image et sa conversion en minature
  public capture() {
    const context = this.canvas.nativeElement.getContext('2d').drawImage(this.video.nativeElement, 0, 0, 320, 240);
    this.captures.push(this.canvas.nativeElement.toDataURL('image/png'));
  }

  // La methode d'affichage des resulats
  gotResults(err, results) {
    // sil y'a erreur
    if (err) {
      console.log(err);
      // s'il y'a pas erreur
    } else {
      this.zone.run(() => {
        // On affiche les resultats dans notre cible de sortie
        this.label = results[0].label;
        this.confidence = results[0].confidence;
      });
      this.mobileNetFeatureExtractor.classify((e, r) => {
        this.gotResults(e, r);
      });
    }
  }

}
