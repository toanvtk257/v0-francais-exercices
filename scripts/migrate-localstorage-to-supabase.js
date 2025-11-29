/**
 * Script de migration des données localStorage vers Supabase
 * À exécuter depuis la console du navigateur sur l'ancien site
 */

async function migrateToSupabase() {
  console.log("🚀 Début de la migration localStorage → Supabase")

  // 1. Migrer les utilisateurs
  const users = JSON.parse(localStorage.getItem("users") || "[]")
  console.log(`📊 ${users.length} utilisateurs à migrer`)

  for (const user of users) {
    try {
      const result = await window.SupabaseDB.users.create({
        email: user.email,
        name: user.name,
        role: user.role,
        pin: user.pin,
        filiere: user.filiere,
        zalo: user.zalo,
        status: user.status || "approved",
      })
      console.log(`✅ Utilisateur migré: ${user.email}`)
    } catch (error) {
      console.error(`❌ Erreur pour ${user.email}:`, error.message)
    }
  }

  // 2. Migrer les exercices
  const exercises = {
    lecture: JSON.parse(localStorage.getItem("exercices-lecture") || "[]"),
    ecoute: JSON.parse(localStorage.getItem("exercices-ecoute") || "[]"),
    grammaire: JSON.parse(localStorage.getItem("exercices-grammaire") || "[]"),
    lexique: JSON.parse(localStorage.getItem("exercices-lexique") || "[]"),
  }

  let totalExercises = 0
  for (const [type, exos] of Object.entries(exercises)) {
    console.log(`📚 ${exos.length} exercices de ${type} à migrer`)
    totalExercises += exos.length

    for (const exo of exos) {
      try {
        // Convertir le format d'exercice
        const questions = []

        // QCM
        if (exo.qcm && exo.qcm.length > 0) {
          exo.qcm.forEach((q, i) => {
            questions.push({
              type: "qcm",
              number: i + 1,
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
            })
          })
        }

        // Vrai/Faux
        if (exo.vf && exo.vf.length > 0) {
          exo.vf.forEach((q, i) => {
            questions.push({
              type: "vf",
              number: questions.length + 1,
              question: q.question,
              correctAnswer: q.correctAnswer,
            })
          })
        }

        // Texte à trous
        if (exo.cloze && exo.cloze.length > 0) {
          exo.cloze.forEach((q, i) => {
            questions.push({
              type: "cloze",
              number: questions.length + 1,
              sentence: q.sentence,
              correctAnswer: q.correctAnswer,
            })
          })
        }

        const result = await window.SupabaseDB.exercises.create({
          id: exo.id,
          type: type,
          niveau: exo.niveau,
          theme: exo.theme,
          titre: exo.titre,
          texte: exo.texte,
          audio: exo.audio,
          questions: questions,
        })

        console.log(`✅ Exercice migré: ${exo.titre}`)
      } catch (error) {
        console.error(`❌ Erreur pour exercice ${exo.titre}:`, error.message)
      }
    }
  }

  // 3. Migrer les résultats
  const allResults = JSON.parse(localStorage.getItem("exerciseResults") || "{}")
  let totalResults = 0

  for (const [userId, results] of Object.entries(allResults)) {
    if (!results || results.length === 0) continue

    console.log(`📈 ${results.length} résultats pour utilisateur ${userId}`)
    totalResults += results.length

    for (const result of results) {
      try {
        await window.SupabaseDB.exercises.saveAttempt(userId, result.exerciseId, {
          score: result.score,
          maxScore: result.maxScore,
          percentage: result.percentage,
          timeSpent: result.timeSpent || 0,
          answers: result.answers || [],
          completedAt: result.completedAt || new Date().toISOString(),
        })
        console.log(`✅ Résultat migré pour exercice ${result.exerciseId}`)
      } catch (error) {
        console.error(`❌ Erreur pour résultat:`, error.message)
      }
    }
  }

  // 4. Migrer les messages
  const messages = JSON.parse(localStorage.getItem("adminMessages") || "[]")
  console.log(`💬 ${messages.length} messages à migrer`)

  for (const msg of messages) {
    try {
      await window.SupabaseDB.messages.send({
        senderId: msg.from,
        content: msg.content,
        recipients: msg.recipients || [msg.to],
        groupId: msg.groupId,
        isGroupMessage: msg.isGroupMessage || false,
        createdAt: msg.timestamp,
      })
      console.log(`✅ Message migré`)
    } catch (error) {
      console.error(`❌ Erreur pour message:`, error.message)
    }
  }

  // 5. Migrer les demandes d'inscription
  const requests = JSON.parse(localStorage.getItem("registrationRequests") || "[]")
  console.log(`📝 ${requests.length} demandes d'inscription à migrer`)

  for (const req of requests) {
    try {
      await window.SupabaseDB.registrations.create({
        email: req.email,
        name: req.name,
        pin: req.pin,
        filiere: req.filiere,
        zalo: req.zalo,
        explanation: req.explanation,
        status: req.status || "pending",
      })
      console.log(`✅ Demande migrée: ${req.email}`)
    } catch (error) {
      console.error(`❌ Erreur pour demande ${req.email}:`, error.message)
    }
  }

  // 6. Migrer les ressources externes
  const resources = JSON.parse(localStorage.getItem("externalResources") || "[]")
  console.log(`🔗 ${resources.length} ressources à migrer`)

  for (const res of resources) {
    try {
      await window.SupabaseDB.resources.create({
        titre: res.titre,
        description: res.description,
        url: res.url,
        categorie: res.categorie,
      })
      console.log(`✅ Ressource migrée: ${res.titre}`)
    } catch (error) {
      console.error(`❌ Erreur pour ressource:`, error.message)
    }
  }

  console.log("\n🎉 Migration terminée!")
  console.log(`📊 Résumé:`)
  console.log(`  - ${users.length} utilisateurs`)
  console.log(`  - ${totalExercises} exercices`)
  console.log(`  - ${totalResults} résultats`)
  console.log(`  - ${messages.length} messages`)
  console.log(`  - ${requests.length} demandes`)
  console.log(`  - ${resources.length} ressources`)
}

// Exécuter la migration
// migrateToSupabase().catch(console.error);

console.log("📋 Script de migration chargé. Exécutez migrateToSupabase() pour commencer.")
