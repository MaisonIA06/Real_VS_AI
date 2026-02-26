"""
Management command to auto-create Category and MediaPair entries
by scanning the media/pairs/ directory structure.

Convention:
  - Real files:  media/pairs/real/{category}/{name}.{ext}
  - AI files:    media/pairs/ai/{category}/{name}_AI.{ext}

Extensions may differ between real and AI versions.
"""
import os
import re
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings

from apps.game.models import Category, MediaPair


# Extensions considérées comme images
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'}
# Extensions considérées comme vidéos
VIDEO_EXTENSIONS = {'.mp4', '.webm', '.mov', '.avi', '.mkv'}
# Extensions considérées comme audio
AUDIO_EXTENSIONS = {'.mp3', '.wav', '.ogg', '.flac', '.m4a'}


def get_media_type(ext):
    """Détermine le type de média à partir de l'extension."""
    ext = ext.lower()
    if ext in IMAGE_EXTENSIONS:
        return 'image'
    elif ext in VIDEO_EXTENSIONS:
        return 'video'
    elif ext in AUDIO_EXTENSIONS:
        return 'audio'
    return None


class Command(BaseCommand):
    help = (
        "Scanne media/pairs/real/ et media/pairs/ai/ pour créer "
        "automatiquement les Category et MediaPair manquants en base."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help="Affiche ce qui serait créé sans rien modifier en base.",
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help="Recrée les paires même si elles existent déjà (par chemin de fichier).",
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        force = options['force']

        real_root = Path(settings.MEDIA_ROOT) / 'pairs' / 'real'
        ai_root = Path(settings.MEDIA_ROOT) / 'pairs' / 'ai'

        if not real_root.exists():
            raise CommandError(f"Le dossier {real_root} n'existe pas.")
        if not ai_root.exists():
            raise CommandError(f"Le dossier {ai_root} n'existe pas.")

        # -----------------------------------------------------------------
        # 1. Indexer tous les fichiers AI par (catégorie, nom_base_lower)
        #    pour pouvoir matcher même si l'extension ou la casse diffère
        # -----------------------------------------------------------------
        ai_index = {}  # { (category_slug, base_name_lower): ai_file_path_relative }

        for category_dir in sorted(ai_root.iterdir()):
            if not category_dir.is_dir():
                continue  # Ignorer les fichiers orphelins à la racine
            category_slug = category_dir.name.lower()

            for ai_file in sorted(category_dir.iterdir()):
                if not ai_file.is_file():
                    continue

                stem = ai_file.stem  # ex: "Taj_Mahal_AI"
                # Retirer le suffixe _AI (insensible à la casse)
                base_name = re.sub(r'_AI$', '', stem, flags=re.IGNORECASE)
                key = (category_slug, base_name.lower())

                # Chemin relatif depuis MEDIA_ROOT
                rel_path = ai_file.relative_to(settings.MEDIA_ROOT)
                ai_index[key] = str(rel_path)

        self.stdout.write(
            self.style.SUCCESS(f"📁 {len(ai_index)} fichiers AI indexés")
        )

        # -----------------------------------------------------------------
        # 2. Parcourir les fichiers réels et matcher avec l'IA
        # -----------------------------------------------------------------
        created_categories = 0
        created_pairs = 0
        skipped_pairs = 0
        unmatched = []

        for category_dir in sorted(real_root.iterdir()):
            if not category_dir.is_dir():
                continue  # Ignorer les fichiers orphelins à la racine

            category_name = category_dir.name.capitalize()
            category_slug = category_dir.name.lower()

            # Créer ou récupérer la catégorie
            if dry_run:
                cat_exists = Category.objects.filter(
                    name__iexact=category_name
                ).exists()
                if not cat_exists:
                    self.stdout.write(
                        f"  [DRY-RUN] Créerait la catégorie : {category_name}"
                    )
                    created_categories += 1
                category = None
            else:
                category, cat_created = Category.objects.get_or_create(
                    name__iexact=category_name,
                    defaults={'name': category_name}
                )
                if cat_created:
                    created_categories += 1
                    self.stdout.write(
                        self.style.SUCCESS(f"  ✅ Catégorie créée : {category_name}")
                    )

            # Parcourir les fichiers réels de cette catégorie
            for real_file in sorted(category_dir.iterdir()):
                if not real_file.is_file():
                    continue

                real_stem = real_file.stem  # ex: "Taj_Mahal"
                real_ext = real_file.suffix  # ex: ".jpg"
                media_type = get_media_type(real_ext)

                if media_type is None:
                    self.stdout.write(
                        self.style.WARNING(
                            f"  ⚠️  Extension inconnue ignorée : {real_file.name}"
                        )
                    )
                    continue

                # Chemin relatif depuis MEDIA_ROOT
                real_rel = str(real_file.relative_to(settings.MEDIA_ROOT))

                # Chercher le fichier AI correspondant
                key = (category_slug, real_stem.lower())
                ai_rel = ai_index.get(key)

                if not ai_rel:
                    unmatched.append(real_rel)
                    self.stdout.write(
                        self.style.WARNING(
                            f"  ⚠️  Pas de fichier AI trouvé pour : {real_file.name}"
                        )
                    )
                    continue

                # Vérifier si la paire existe déjà
                if not force:
                    existing = MediaPair.objects.filter(
                        real_media=real_rel,
                        ai_media=ai_rel,
                    ).exists()
                    if existing:
                        skipped_pairs += 1
                        continue

                if dry_run:
                    self.stdout.write(
                        f"  [DRY-RUN] Créerait : {real_file.name} ↔ "
                        f"{Path(ai_rel).name} ({media_type}, {category_name})"
                    )
                    created_pairs += 1
                else:
                    MediaPair.objects.create(
                        category=category,
                        real_media=real_rel,
                        ai_media=ai_rel,
                        media_type=media_type,
                        difficulty='medium',
                        is_active=True,
                    )
                    created_pairs += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"  ✅ Paire créée : {real_file.name} ↔ "
                            f"{Path(ai_rel).name} ({media_type})"
                        )
                    )

        # -----------------------------------------------------------------
        # 3. Résumé
        # -----------------------------------------------------------------
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 50))
        prefix = "[DRY-RUN] " if dry_run else ""
        self.stdout.write(
            self.style.SUCCESS(f"{prefix}📊 Résumé :")
        )
        self.stdout.write(f"   Catégories créées  : {created_categories}")
        self.stdout.write(f"   Paires créées      : {created_pairs}")
        self.stdout.write(f"   Paires ignorées    : {skipped_pairs} (déjà existantes)")
        self.stdout.write(f"   Fichiers sans match: {len(unmatched)}")

        if unmatched:
            self.stdout.write("")
            self.stdout.write(self.style.WARNING("Fichiers réels sans correspondance AI :"))
            for f in unmatched:
                self.stdout.write(f"   - {f}")

        self.stdout.write(self.style.SUCCESS("=" * 50))
