// on vas rajouter un prefixe qui vas nous permettre de changer de version de worker apres chaque modification 
const PREFIX = 'V9'


// si j'ai des pages que je veux mettre en pages ou peut etre des element de boostrape que je veux egalement mettre en cahce je peut regrouper leur lien 
const CACHED_FILES = []
// on vas ecouter deux evenement installation activation 
self.addEventListener('install',(event)=>{
    // avec la methode self.skipWaiting() on arrete tous les processus pour utiliser el nouveau qui s'est installe
    self.skipWaiting()

    // on vas proceder a la mise en cache de notre page hors connexion grace a la methode waitUntil() qui met en pause l'installation et resout la promesse 
    // cette methode est elle meme une promesse
    // pour cela j'ajout un event au niveau de la fonction 
    event.waitUntil((async ()=>{
        // on ouvre le cache et on lui passe comme clé de cache notre prefix
        const cache = await caches.open(PREFIX)

        // en ce moment pour tout regrouper je fasi comme pour la suppresion des key 
        // on met tout dans une promesse et on map le tout 
        await Promise.all([...CACHED_FILES, "/page2.html"].map((path)=>{
            return cache.add(new Request(path))
        }))

        // la c'etait avant de tout regrouper pour mettre en cache
        // // avec la methode add avec une requette on passe des elements en cahe 
        // cache.add(new Request("page2.html"))
    })())
    console.log(`${PREFIX}, Install`)

})

self.addEventListener('activate',(event)=>{
    // avec le client.clain() on lui dis dès qu'il est activer qu'il puissent controler la page pour eviter les requette qui ne parte pas 
    clients.claim()
    // pour ne pas surcharger le caches a chaque nouvel vers des prefixe on vas supprimer les anciennes 
    event.waitUntil(( async ()=>{
        // je recupere l'ensemble des clées 
        const keys = await caches.keys()
        // pour le moment pour chacune des clées recupere on vas faire un console.log
        await Promise.all(
            keys.map((key)=>{
                console.log(key)
                // suivant la logique on peut dire que si la clées ne suis pas le prefixe on peut la supprimer
                if(!key.includes(PREFIX)){
                    return caches.delete(key)
                }
            })
        )
    })())
    console.log(`${PREFIX}, activate`)
    
})

// le self ca fait reference au services worker 
// dans le service worker je n'ai pas acces a windows ou a document 

self.addEventListener('fetch', (event)=>{
    // pour gerer le fonctionnement hors ligne on vas d'abors jouer sur le fetch qui cherche une ressources particuliere 
    console.log(` ${PREFIX} Fetching : ${event.request.url}, Mode : ${event.request.mode}`)

    // au niveau du mode lorsqu'on vas le recuperer on peut faire en sorte de lorsque le mode est navigate l'intercepter pour effectuer des actions 
    if (event.request.mode === 'navigate'){
        // on peut utiliser la methode respondWith qui attend une promese et non une fonction 
        event.respondWith((async ()=>{
            try{
                // on vas egalement voir si on as une reponse de type preload
                const preloadResponse = await event.preloadResponse
                // si la reponse preloade est disponible on la retourne
                if(preloadResponse){
                    return preloadResponse
                }

                // on vas egalemtn chercher a acceder a la ressource consulter par le reseau
                return await fetch(event.request)
                
            }catch(err){
                // en cas d'erreur on retourne notre reponse bonjour Cedric
                // on retourne une nouvelle reponse bonjour Cedric 
                // return new Response("Bonjour cédric")
                
                // cette fois ci au lieu de retourner juste du texte je peut lire le cache et retourner la page que j'ai stoker la bas 
                // on reouvre le cache 
                const cache = await caches.open(PREFIX)
                // et on fait notre requette 
                // egalement pour le style il faut que je le sauvegarde le style dans le cache afin de pouvoir le retourner en meme temps que la page de gors connexion
                return  await cache.match("/page2.html")
            }
            
        })())
    }
    else if(CACHED_FILES.includes(event.request.url)){ // la si l'element que l'on veut charger est deja en cache on peut directement le ressortir de la bas plutot que de le recharger une fois de plus 

        event.respondWith(caches.match(event.request))  // et la on repond avec l'element voulu 
    }
})