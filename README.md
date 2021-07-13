# Public Eye

This repository contains code for the "Public Eye" project of the municipality of Amsterdam. This project works towards a reusable and open-source approach for ethical crowd measurements, based on video streams.

Please see `install/INSTALL.md` for the installation procedure.



----



# Intuïtieve Beschrijving van Public Eye

Public Eye is een softwareproduct dat kan worden ingezet voor crowd monitoring in de (publieke) ruimte. Om Public Eye te laten werken, zijn er camera’s nodig waar deze crowd monitoring wordt ingezet.

Public eye is onderdeel van het Crowd Monitoring Systeem Amsterdam (CMSA). Dit is een breder programma dat crowd monitoring Amsterdam-breed aanpakt. Door data te verzamelen over aantallen, dichtheden en stromen van voetgangers is het mogelijk om slimmer maatregelen te treffen. Zo kan (piek)drukte worden vermeden of in goede banen worden geleid. Hierdoor blijft de stad zowel op de korte, middellange als de lange termijn comfortabel, bereikbaar en veilig.

Bij crowd monitoring wordt expliciet NIET gebruik gemaakt van methoden om individuele personen te identificeren (denk daarbij aan gezichtsherkenning).

### Eigenschappen van Public Eye

- Gratis te downloaden en gebruiken.
- Te installeren op eigen servers (of cloud-machines).
  - Controle over eigen data.
- Open source.
  - Audits goed mogelijk.
  - Werking volledig inzichtelijk.
- Gebouwd met de principes van privacy by design.
  - De privacy van mensen in de openbare ruimte wordt gewaarborgd. (zie ook de [privacyverklaring](https://www.amsterdam.nl/privacy/specifieke/privacyverklaring-parkeren-verkeer-bouw/public-eye/) van Public Eye en de [algoritmeregister-entry](https://algoritmeregister.amsterdam.nl/public-eye/)).
  - Operationeel wordt alleen inzicht gegeven in crowd monitoring statistieken. De camerabeelden zelf worden niet bewaard. Een uitzondering hierop is het bewaren van kleine sets camerabeelden voor het trainen van nieuwe voorspelmodellen.
- Hardware requirements:
  - GPU: 1x 2080 TI (of beter) per ~60 cameras. Dit zou voldoende GPU capaciteit moeten geven voor 1 personentelling per camera per minuut.
  - CPU: Dit is afhankelijk van de benodigde capaciteit. Wij zouden momenteel aanraden ca. 8 moderne cores in te zetten (bijv. d.m.v. een AMD Ryzen 3rd gen CPU) per gebruikte GPU.



# Achterliggende Technologie

Public Eye maakt gebruik van computervisie algoritmen uit de kunstmatige intelligentie (KI). Deze algoritmen zijn deels overgenomen uit recent wetenschappelijk onderzoek. Ook zijn er nieuwe algoritmen ontwikkeld door het Public Eye team zelf, in samenwerking met afstuderende kunstmatige intelligentie masterstudenten van de Universiteit van Amsterdam.

De afgelopen jaren hebben er grote verbeteringen plaatsgevonden in het vakgebied van computervisie. Dit komt grotendeels dankzij de opkomende populariteit van “deep learning”, waarbij grote gesimuleerde neurale netwerken worden ingezet om complexe taken uit te voeren. De recente ontwikkelingen in deep learning worden deels gedreven door nieuwe wetenschappelijke inzichten. Maar ook door het snel goedkoper en krachtiger worden van de hardware waar deze technologie gebruik van maakt: de ‘Graphics Processing Unit’ (GPU).

### Algoritmen

Tijdens de ontwikkeling van Public Eye zijn er vele visuele crowd counting algoritmes bekeken die recentelijk vanuit de wetenschap ontwikkeld zijn. Meerdere van deze algoritmen zijn in de praktijk uitgeprobeerd om de prestaties te bekijken, maar ook om te zien of deze voldoen aan de wensen van het project m.b.t. maatschappelijk perspectief.

In de praktijk is er bij Public Eye voor gekozen om voornamelijk gebruik te maken van de bestaande algoritmen CSRNet en YOLO V5 voor personentelling. Daarnaast is vanuit het Public Eye team zelf een crossing-line algoritme ontwikkeld. In onderstaande bullets nemen we deze algoritmen in vogelvlucht door.

- **CSRNet (2018)**
  - CSRNet is een ‘convolutional neural network’ dat is ontwikkeld om een “dichtheidskaart” te maken op basis van beelden van groepen mensen. Een dergelijke dichtheidskaart geeft een schatting hoeveel mensen er in beeld staan en hoe dicht zij bij elkaar staan.
  - ![img](https://lh5.googleusercontent.com/kecCIlzc0Q48w0xfPqP_zoii0U-s1W-LePLuoiSRsci7MKWdV6-NMs-CPeLJsPLhW5JC4m_CYG9jS0T3SGG1Ol87Zwdk3CPSe0WrP_--e8a9iY3pVjBT1PPKtO6FCfwXEQCOgPeL)
  - Dit algoritme is er op gericht om goed te werken met beelden van drukke situaties (waarbij mensen soms voor en achter elkaar staan). Dit netwerk is computationeel relatief zwaar om te draaien en heeft vrij veel geannoteerde data nodig per camera/locatie om een goed model te trainen voor die camera.
  - Als er voldoende geannoteerde data aanwezig is voor een camera (zeg 300 beelden voor een camera), dan kan er een **camera-specifiek** CSRNet model worden getraind. Zo een model geeft doorgaans zeer goede resultaten bij het genereren van personentelling.
  - Een **generiek** CSRNet model (dat niet getraind is voor een specifieke camera) werkt in de praktijk vaak aardig, maar kan in sommige situaties ondermaats presteren (bijv. als er afwijkende elementen in beeld zijn, zoals bomen, reflecterend water, sneeuw, etc.).
  - [Link naar paper](https://arxiv.org/abs/1802.10062).
  - [Link naar GitHub](https://github.com/leeyeehoo/CSRNet-pytorch).
- **YOLO V5 (2020)**
  - YOLO V5 is een neuraal netwerk dat is ontwikkeld om ‘objecten’ te herkennen. Dit netwerk kan ook de ‘mens’ als algemeen ‘object’ herkennen, waarmee het dus ingezet kan worden voor crowd monitoring doeleinden. Het kan dan bijv. gebruikt worden om aantallen mensen te tellen en om afstanden tussen deze mensen te schatten.
  - ![img](https://lh4.googleusercontent.com/EDGHOBJXqyVtdIZRegy6E67QuKBd-uuguVB7Ayj8hAmYZg70COPT7NmBkjAKWNiEkETjN-VDkTgsDYxURiEK6wvpEoGjDIfcsqgWCBIZJ7fj5tJTRA7kYUMD-3Kn4kjfAbDkC3Lc)
  - Dit netwerk is computationeel relatief licht om te draaien, maar is vrij foutgevoelig wanneer het wordt gebruikt voor het analyseren van beelden van drukke situaties.
  - YOLO V5 kan ook redelijk goed gebruikt worden om de looprichting van mensen in kaart te brengen, door de sporen van in beeld gedetecteerde mensen te volgen. Echter werkt dit doorgaans alleen goed wanneer bij niet-drukke situaties.
  - [Link naar de YOLO V4 paper; YOLO V5 is hier een “spin-off” van](https://arxiv.org/abs/2004.10934).
  - [Link naar GitHub van YOLO V5](https://github.com/ultralytics/yolov5).
- **Crossing-Line Counting Algoritme (2020)**
  - Dit algoritme is ontwikkeld met het Public Eye team, binnen een afstudeerproject van een UvA KI masterstudent.
  - Dit algoritme combineert in grote lijnen een model dat “dichtheidskaarten” kan genereren, met een model dat een schatting kan maken van “flow” (ofwel de bewegingen in beeld, obv video-data). Door de dichtheidskaarten en de flow slim met elkaar te combineren kan een schatting worden gemaakt van de **bewegingsrichting** van (groepen) mensen. Hiermee kan kan worden bepaald hoeveel mensen specifieke lijnen in beeld overschrijden (in beide richtingen).
  - ![img](https://lh3.googleusercontent.com/LCCbMIRvEwubABN5mdfpJdXTMGL2qE64d8JlqPahTQHlP2wVr5Qj0d__chGl-h4_OKjK4IiMqOCEc89lSIncoO3of0SMYSpGkCptQWWjWrL0xJtShnuRMmHIpGU_FETqoqP0w_FH)
  - Dit algoritme heeft als voordeel het “flow”-gedeelte van de aanpak unsupervised getraind wordt. Dit bespaart veel annotatie-tijd.
  - Dit netwerk is te trainen voor een specifieke camera met behulp van videomateriaal van deze camera, waarbij een relatief kleine subselectie van videobeelden geannoteerd hoeft te worden.
  - Dit algoritme werkt goed in complexe situaties waarbij grote groepen mensen in beeld zijn en mogelijk voor en achter elkaar langs lopen.
  - [Link naar thesis](https://scripties.uba.uva.nl/search?id=720005).
  - [Link naar GitHub](https://github.com/ijanerik/Crossing-Line-Counting).



### Data

De generieke voorspelmodellen die binnen Public Eye worden ingezet zijn doorgaans (voor)getrained op publieke crowd-counting datasets (zoals de [ShanghaiTech A & B datasets](https://www.kaggle.com/tthien/shanghaitech)). De data die vanuit de gemeente zelf wordt verzameld wordt nauwkeurig geannoteerd, waarbij we heldere richtlijnen gebruiken die in de Public Eye tool zelf direct zichtbaar zijn voor mensen die werken aan deze annotaties. Een overzicht van deze richtlijnen is te lezen in de bijlage onderaan dit bestand.

Wanneer er camera-specifieke voorspelmodellen worden getraind, dan wordt deze zelf-geannoteerde data relatief zwaar meegewogen bij het trainen van het voorspelmodel. Hiermee zal het voorspelmodel dus een zware invloed krijgen vanuit onze zelf geannoteerde data.

![img](https://lh4.googleusercontent.com/5-N_kxrRoH179sE6G1jhRMlhmrBF3OQz413J9QBRlS1Hy-PMrmRrR9cnc9zSShBeO0YBQXXbq2fe5pthC9ekonQJHLCOUnEJsItx2wlCZtcx0wdWhvrSYp6vMNDo9pau67pXpcwn)

Wanneer er camera-specifieke voorspelmodellen worden getraind, dan wordt deze zelf-geannoteerde data relatief zwaar meegewogen bij het trainen van het voorspelmodel. Hiermee zal het voorspelmodel dus een zware invloed krijgen vanuit onze zelf geannoteerde data.

Om inzicht te krijgen in enige bias die mogelijk zou kunnen voorkomen in onze getrainde modellen, is er het plan opgekomen om in de toekomst een set met test-beelden te genereren waarin een set van mensen met verschillende verschijningen in gevarieerde situaties voorkomen. Hiermee zou geanalyseerd kunnen worden of getrainde modellen een bepaalde statistische bias hebben jegens specifieke uiterlijke kenmerken.



### Onderliggende Software

Hieronder volgt een lijst met de belangrijkste onderliggende software pakketten waar Public Eye mee is ontwikkeld.

- **Python**

  - Python is een programmeertaal die veel wordt gebruikt voor data science, Artificial Intelligence en back-end werk.
  - Binnen Public Eye wordt Python voornamelijk gebruikt voor het draaien van de slimme algoritmes. Er wordt hierbij veel gebruik gemaakt van de Python library ‘Pytorch’ voor de implementatie van deep learning methoden.

- **JavaScript**

  - JavaScript is een programmeertaal die veel gebruikt wordt voor front-end werk. JavaScript kan bijvoorbeeld goed worden ingezet voor het bouwen van interactieve websites.
  - Binnen Public Eye wordt JavaScript gebruikt voor het bouwen van een gebruikersinterface die de onderliggende functionaliteiten van Public Eye aanstuurt. De JavaScript library ‘React’ speelt hierbij een hoofdrol.

- **PostgreSQL**

  - PostgreSQL is een relationeel database-systeem, waar efficiënt grote hoeveelheden gegevens kunnen worden opgeslagen en opgevraagd.
  - Binnen Public Eye wordt PostgreSQL gebruikt om alle onderliggende data die Public Eye nodig heeft te beheren. Denk hierbij bijvoorbeeld aan: informatie over de camera’s (locatie, framerate, regions-of-interest), datasets (foto’s + annotaties, welke gebruikt kunnen worden om neurale netwerken te trainen), neurale netwerken (getrainde gewichten voor een netwerk) en gebruikers (welke gebruikers zijn er, en welke rol/rechten hebben zijn in Public Eye).

- **Git**

  - Git is een gedecentraliseerd systeem voor de versiebeheer van code. Public Eye maakt gebruik van Git voor het beheren van projectcode. Hierbij wordt de service Github gebruikt om de samenwerking te vergemakkelijken.
  - De installatie instructies van Public Eye staan beschreven in een markdown bestand op deze Github repository, zie: install/INSTALL.md. Deze instructies zijn ‘battle-hardened’.
  - **Sidenote:** er is momenteel nog geen continuous integration (CI) en continuous deployment (CD) workflow opgezet voor Public Eye. Hier zal in een latere fase verdere aandacht aan besteed moeten worden.

  

### Open Sourcing

Er zijn enkele redenen waarom Public Eye open source wordt gemaakt:

- **Ontwikkelkosten**
  - Als open source software kan Public Eye blijven doorontwikkelen. Publieke contributors kunnen in deze vorm ook bijdragen aan de doorontwikkeling.
- **Grip**
  - Als open source software is Public Eye zelf te beheren. Hierdoor kunnen partijen zelf grip houden op hun systeem. Ze kunnen de opgenomen camerabeelden volledig binnen hun eigen infrastructuur houden (en dus niet met externe partij delen). Daarnaast kan het systeem naar eigen wens worden doorontwikkeld voor andere behoeftes, denk aan tellen van fietsers, vogeltjes en vuilniszakken.
- **Onafhankelijkheid**
  - Door de beschikbaarheid van Public Eye als open source software zijn gemeenten voor hun softwarematige crowd monitoring capaciteiten minder afhankelijk van de grillen van de markt.
- **Transparantie**
  - Door Public Eye open source te maken wordt een systeem dat wordt gebruikt voor crowd monitoring inzichtelijk en controleerbaar.
- **Publiek geld**
  - Alles wat we met publiek geld maken dient ook ten behoeve van dat publiek te komen. Dit doen we natuurlijk door de openbare ruimte hiermee beter te managen, maar dmv open source maken ook door de directe opbrengsten in de vorm van broncode terug te geven aan de maatschappij.



### Licentie

De Public Eye repository wordt uitgebracht onder de [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.nl.html) (zie licenses/GPLv3_license.txt). Geïntegreerd softwarepaketten in de repository worden uitgebracht onder hun eigen license, zoals gespecificeerd in enkele folders (middels README.md bestanden) en/of comments bovenaan de bestanden zelf. Onderdelen die door het Public Eye team zelf zijn geschreven binnen deze codebase worden uitgebracht onder de [EUPL V1.2](https://joinup.ec.europa.eu/sites/default/files/custom-page/attachment/2020-03/EUPL-1.2%20EN.txt) license (zie licenses/EUPL-1.2_license.txt).



-------------

Bijdragers aan het Public Eye project: Daan Groenink, Boen Groothoff, Tom van Arman, Markus Pfundstein, Joeri Sleegers, Aurore Paligot, Jan Erik van Woerden, Lando de Weerdt, Thomas Jongstra, Maarten Sukel, Richard Drewes, Eelco Thiellier.



-------------

**Bijlage: Public Eye - Tagging Policy**

| **Observation**                                              | **Solution**                                                 |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| A person’s body is visible, but their head is NOT visible (it is outside of the screen, or fully obfuscated by an object in the scene, like a pillar or a statue). | NO tag should be created for this person.                    |
| A person’s head is partially visible (e.g. because another person’s head or an object is partially in front of it). | Tag the location where the centerpoint of their head would be, even if this centerpoint does not fall on a visible part of their head. |
| A person is hidden behind an umbrella.                       | A tag should be created for this person, on the location where the centerpoint of their head is expected to be. |
| TWO OR MORE people are hidden behind an umbrella.            | A tag should be created for these people, on the locations where the centerpoint of their heads are expected to be. |
| A person’s head is not visible due to relatively common street gear (hat/cap/scarf/headscarf/niqab/mouth mask/burqa). | Tag the location where you expect the centerpoint of the person’s head to be. |
| A person’s head is not visible due to wearing street performer gear (mascotte-suit/full body paint/living-statue arrite). | NO tag should be created for this person.                    |
| A person is very far away, but I’m certain it is a person.   | Tag the centerpoint of their head.                           |
| A person is very far away. I’m NOT SURE it’s a person though… | Place an “uncertain” tag on the centerpoint of their might-be head. (This ‘uncertain’-tag is still a feature to be implemented.) |
| There is something person-like visible in the image. It might actually be a person, but I’m NOT sure (i.e. due image noise, lens flare, water drops on the lens, image fuzziness, etc.). | NO tag should be created for this possible person.           |
| There is a baby cart visible, and I can see the baby’s head. | Place a tag on the centerpoint of the baby’s head.           |
| There is a baby cart visible, but I can’t see the baby’s head. | NO tag should be created.                                    |
| There is someone swimming in the water, next to the boardwalk that we are interested in. | Tag the centerpoint of the swimming person’s head.           |
| There is someone on a boat, next to the boardwalk that we are interested in. | Tag the centerpoint of the person’s head.                    |
| A person’s head seems to be “split”, and appears “twice”.    | This is likely caused by faulty image stitching. Place a single tag on the centerpoint of the most complete "head-split" |
| A person is visible behind a translucent object (a banner, fishnet, tree branch, etc.). | Tag the centerpoint of the person’s head.                    |
| A person is visible by means of a reflective surface (e.g. mirror, window, water surface). | NO tag should be created for this person’s reflection.       |
| A person’s image is visible on a poster.                     | NO tags should be created for this poster.                   |
| A statue of a person or clothing-mannequin is visible.       | NO tag should be created for the statue/mannequin.           |
| People are sitting still at a cafe.                          | Tag the centerpoints of the people’s heads.                  |
| The image quality is bad / much lower than normal. Should I even create tags? | Tag the centerpoints of the people’s heads. Also, please write down the number of the image that this occurred with, and pass this information to the quality evaluation team and the developers. |
| There is a hunched-over person, whose head is not visible.   | Tag the centerpoint of where you expect the head of this person to be. |

