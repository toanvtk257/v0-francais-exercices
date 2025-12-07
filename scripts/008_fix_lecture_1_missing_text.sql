-- Fix lecture-1 exercise that has NULL texte field
-- This exercise has 7 questions but no reading text, which prevents students from completing it

-- Add a default text for lecture-1 if it exists and has no text
UPDATE exercises 
SET texte = 'Texte de lecture\nVeuillez ajouter le texte de lecture pour cet exercice via le builder.'
WHERE id = 'lecture-1' 
  AND type = 'lecture' 
  AND (texte IS NULL OR texte = '');

-- Display result
SELECT id, titre, type, niveau, 
       CASE 
         WHEN texte IS NULL THEN 'NULL'
         WHEN texte = '' THEN 'EMPTY'
         ELSE LEFT(texte, 50) || '...'
       END as texte_status,
       jsonb_array_length(questions) as question_count
FROM exercises 
WHERE id = 'lecture-1';
